import bcrypt from "bcrypt";
import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({connectionString: process.env.POSTGRES_URL});

describe("PUT /api/recipes/:id - Recipe Editing", () => {
  jest.setTimeout(60000);

  let testUser: {id: number; username: string; email: string};
  let otherUser: {id: number; username: string; email: string};
  let testRecipeId: number;

  beforeAll(async () => {
    //create user for authentication
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const username = `testuser_${timestamp}_${random}`;
    const email = `testuser_${timestamp}_${random}@example.com`;
    const password = "password123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email`,
      [username, email, hashedPassword]
    );

    testUser = result.rows[0];

    //create another for authorization test
    const otherTimestamp = Date.now();
    const otherRandom = Math.random().toString(36).substring(7);
    const otherUsername = `otheruser_${otherTimestamp}_${otherRandom}`;
    const otherEmail = `otheruser_${otherTimestamp}_${otherRandom}@example.com`;

    const otherResult = await pool.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email`,
      [otherUsername, otherEmail, hashedPassword]
    );

    otherUser = otherResult.rows[0];

    //create test recipe owned by testuser
    const recipeResult = await pool.query(`
      INSERT INTO recipes (author_id, title, image_url, ingredients, steps)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [testUser.id, "Original Recipe", "http://example.com/original.jpg", ["ingredient 1", "ingredient 2"], ["step 1", "step 2"]]
    );

    testRecipeId = recipeResult.rows[0].id;
  });

  beforeEach(async () => {
    //reset recipe to original state before each test
    await pool.query(`
      UPDATE recipes
      SET title = $1, image_url = $2, ingredients = $3, steps = $4, updated_at = NOW()
      WHERE id = $5`,
      ["Original Recipe", "http://example.com/original.jpg", ["ingredient 1", "ingredient 2"], ["step 1", "step 2"], testRecipeId]
    );
  });

  afterAll(async () => {
    //clean up
    await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [testUser.id, otherUser.id]);
    await pool.end();
  });

  //returns 401 when not authenticated
  it("returns 401 when not authenticated", async () => {
    const recipeData = { 
      title: "Updated Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  //returns 403 for when user is not the author
  it("returns 403 for when user is not the author", async () => {
    const recipeData = {
      title: "Test Recipe", 
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", otherUser.email);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Unauthorized - you can only edit your own recipes");
  });

  //successfully updates recipe with valid data
  it("successfully updates recipe with valid data", async () => {
    const recipeData = { 
      title: "Updated Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Recipe updated successfully");
    expect(res.body.recipe.title).toBe(recipeData.title);
    expect(res.body.recipe.image_url).toBe(recipeData.imageUrl);
    expect(res.body.recipe.ingredients).toEqual(recipeData.ingredients);
    expect(res.body.recipe.steps).toEqual(recipeData.steps);
  });

  //successfully updates recipe without image url
  it("successfully updates recipe without image url", async () => {
    const recipeData = { 
      title: "Updated Recipe Without Image",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(200);
    expect(res.body.recipe.title).toBe(recipeData.title);
    expect(res.body.recipe.image_url).toBeNull();
    expect(res.body.recipe.ingredients).toEqual(recipeData.ingredients);
    expect(res.body.recipe.steps).toEqual(recipeData.steps);
  });

  //updates recipe in database with correct data
  it("updates recipe in database with correct data", async () => {
    const recipeData = { 
      title: "Updated Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(200);

    //verify the recipe was actually updated in the database
    const dbResult = await pool.query(
      "SELECT title, image_url, ingredients, steps FROM recipes WHERE id = $1",
      [testRecipeId]
    );

    expect(dbResult.rows[0].title).toBe(recipeData.title);
    expect(dbResult.rows[0].image_url).toBe(recipeData.imageUrl);
    expect(dbResult.rows[0].ingredients).toEqual(recipeData.ingredients);
    expect(dbResult.rows[0].steps).toEqual(recipeData.steps);
  });

  //filters out empty ingredients and steps
  it("filters out empty ingredients and steps", async () => {
    const recipeData = { 
      title: "Updated Recipe With Empty Items",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "", "   ", "Updated ingredient 4"],
      steps: ["Updated step 1", "Updated step 2", "", "", "   "]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(200);
    expect(res.body.recipe.ingredients).toEqual(["Updated ingredient 1", "Updated ingredient 4"]);
    expect(res.body.recipe.steps).toEqual(["Updated step 1", "Updated step 2"]);
  });

  //returns 400 for missing title
  it("returns 400 for missing title", async () => {
    const recipeData = { 
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  //returns 400 for empty title
  it("returns 400 for empty title", async () => {
    const recipeData = { 
      title: "",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Title is required");
  });

  //returns 400 for missing ingredients
  it("returns 400 for missing ingredients", async () => {
    const recipeData = { 
      title: "Test Recipe",
      imageUrl: "http://example.com/updated.jpg",
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  //returns 400 for empty ingredients array
  it("returns 400 for empty ingredients array", async () => {
    const recipeData = { 
      title: "Test Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: [],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one ingredient required");
  });

  //returns 400 for all empty ingredients array
  it("returns 400 for all empty ingredients array", async () => {
    const recipeData = { 
      title: "Test Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["", "  ", " ", ""],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one ingredient required");
  });

  //returns 400 for missing steps
  it("returns 400 for missing steps", async () => {
    const recipeData = { 
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  //returns 400 for empty steps array
  it("returns 400 for empty steps array", async () => {
    const recipeData = { 
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"], 
      steps: []
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one step required");
  });

  //returns 400 for all empty steps array
  it("returns 400 for all empty steps array", async () => {
    const recipeData = { 
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"], 
      steps: ["", "   ", ""]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one step required");
  });

  //returns 400 for invalid data type for title
  it("returns 400 for invalid data type for title", async () => {
    const recipeData = {
      title: 123,
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //returns 400 for invalid data type for imageUrl
  it("returns 400 for invalid data type for imageUrl", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: 123,
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //returns 400 for invalid data type for ingredients  
  it("returns 400 for invalid data type for ingredients", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: "hi",
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //returns 400 for invalid data type for steps
  it("returns 400 for invalid data type for steps", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: "hi"
    };

    const res = await api.put(`/api/recipes/${testRecipeId}`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //returns 400 for invalid recipe id
  it("returns 400 for invalid recipe id", async () => {
    const recipeData = {
      title: "Test Recipe", 
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put(`/api/recipes/invalid-id`)
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid recipe id");
  });

  //returns 404 for nonexistent recipe
  it("returns 404 for nonexistent recipe", async () => {
    const recipeData = {
      title: "Test Recipe", 
      imageUrl: "http://example.com/updated.jpg",
      ingredients: ["Updated ingredient 1", "Updated ingredient 2"],
      steps: ["Updated step 1", "Updated step 2"]
    };

    const res = await api.put("/api/recipes/99999")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Recipe not found");
  });
});



