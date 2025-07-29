import bcrypt from "bcrypt";
import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({connectionString: process.env.POSTGRES_URL});

describe("POST /api/recipes - Recipe Creation", () => {
  //increase timeout for entire test
  jest.setTimeout(60000); // 60 seconds
  //manage user and session first
  let testUser: {id: number; username: string; email: string};
  let sessionCookie: string;

  beforeAll(async () => {
    //create test user for authen
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

    //for testing, we'll use a custom header to bypass NextAuth
    //this allows us to test the API logic without dealing with session cookies
    sessionCookie = `x-test-user-email=${testUser.email}`;
    console.log("Created test header:", sessionCookie);
  }, 30000); // 30 second timeout

  
  //returns 401 when not authenticated
  it("returns 401 when not authenticated", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData);
    
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  //successfully creates recipe with valid data
  it("successfully creates recipe with valid data", async () => {  
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Recipe created successfully");
    expect(res.body.recipe).toHaveProperty("id");
    expect(res.body.recipe.title).toBe(recipeData.title);
    expect(res.body.recipe.image_url).toBe(recipeData.imageUrl);
    expect(res.body.recipe.ingredients).toEqual(recipeData.ingredients);
    expect(res.body.recipe.steps).toEqual(recipeData.steps);

  });

  //successfully creates recipe without image url
  it("successfully creates recipe without imageUrl", async () => {
    const recipeData = {
      title: "Test Recipe No ImageUrl",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(201);
    expect(res.body.recipe.image_url).toBeNull();
  });

  //filters out empty ingredients and steps
  it("filters out empty ingredients and steps", async () => {
    const recipeData = {
      title: "Test Recipe Filter Empty Ingredients/Steps",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "", "   ", "Ingredient 4"],
      steps: ["    ", "Step 2", "Step 3", ""]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(201);
    expect(res.body.recipe.ingredients).toEqual(["Ingredient 1", "Ingredient 4"]);
    expect(res.body.recipe.steps).toEqual(["Step 2", "Step 3"]);

  });

  //returns 400 for missing title
  it("returns 400 for missing title", async () => {
    const recipeData = {
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  //returns 400 for empty title
  it("returns 400 for empty title", async () => {
    const recipeData = {
      title: "",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Title is required");
  });

  //returns 400 for missing ingredients
  it("returns 400 for missing ingredients", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  //returns 400 for empty ingredients array
  it("returns 400 for empty ingredients array", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: [],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one ingredient required");
  });

  //returns 400 for empty for all empty ingredients array
  it("returns 400 for all empty ingredients array", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["", " ", "    ", ""],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
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
      ingredients: ["Ingredient 1", "Ingredient 2"]
    };

    const res = await api.post("/api/recipes")
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
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: []
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one step required");
  });

  //returns 400 for empty for all empty steps array
  it("returns 400 for all empty steps array", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["", " ", "    ", ""],
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("At least one step required");
  });

  //returns 400 for invalid data type for title
  it("returns 400 for invalid data type for title", async () => {
    const recipeData = {
      title: 123,
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
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
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //returns 400 for invalid data type for ingredients
  it("returns 400 for invalid data type for ingredients", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: "Ingredient 1",
      steps: ["Step 1", "Step 2"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //returns 400 for invalid data type for steps
  it("returns 400 for invalid data type for steps", async () => {
    const recipeData = {
      title: "Test Recipe",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: "Step 1"
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid data format");
  });

  //stores recipe in database with correct author id
  it("stores recipe in database with correct author id", async () => {
    const recipeData = {
      title: "Test Recipe for Author Id",
      imageUrl: "http://example.com/image.jpg",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      steps: ["Step 1"]
    };

    const res = await api.post("/api/recipes")
      .send(recipeData)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(201);
    const recipeId = res.body.recipe.id;

    const dbResult = await pool.query(
      "SELECT * FROM recipes WHERE id = $1",
      [recipeId]
    );

    expect(dbResult.rows.length).toBe(1);
    const dbRecipe = dbResult.rows[0];
    expect(dbRecipe.author_id).toBe(testUser.id);
    expect(dbRecipe.title).toBe(recipeData.title);
    expect(dbRecipe.image_url).toBe(recipeData.imageUrl);
    expect(dbRecipe.ingredients).toEqual(recipeData.ingredients);
    expect(dbRecipe.steps).toEqual(recipeData.steps);
  });

  afterAll(async () => {
    //clean up
    await pool.query(
      "DELETE FROM users WHERE id = $1",
      [testUser.id]
    );
    await pool.end();
  });
});