import bcrypt from "bcrypt";
import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({connectionString: process.env.POSTGRES_URL});

describe("DELETE /api/recipes/:id - Recipe Deletion", () => {
  jest.setTimeout(6000);

  let testUser: {id: number; username: string; email: string};
  let otherUser: {id: number; username: string; email: string};
  let testRecipeId: number;

  beforeAll(async () => {
    //create user for authenticationc
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
    const otherUsername = `testuser_${otherTimestamp}_${otherRandom}`;
    const otherEmail = `testuser_${otherTimestamp}_${otherRandom}@example.com`;

    const otherResult = await pool.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email`,
      [otherUsername, otherEmail, hashedPassword]
    );

    otherUser = otherResult.rows[0];
  });

  beforeEach(async () => {
    //create test recipe before each test
    const recipeResult = await pool.query(`
      INSERT INTO recipes (author_id, title, image_url, ingredients, steps)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [testUser.id, "Test Recipe", "http://example.com/image.jpg", ["ingredient 1", "ingredient 2"], ["step 1", "step 2"]]
    );

    testRecipeId = recipeResult.rows[0].id;
  });

  //return 401 when not authenticated
  it("returns 401 when not authenticated", async () => {
    const res = await api.delete(`/api/recipes/${testRecipeId}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  //return 403 when user is not the author
  it("returns 403 when user is not the author", async () => {
    const res = await api.delete(`/api/recipes/${testRecipeId}`)
      .set("x-test-user-email", otherUser.email);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Unauthorized - you can only delete your own recipes");
  });

  //successfully deletes recipe with valid data
  it("successfully deletes recipe with valid data", async () => {
    const res = await api.delete(`/api/recipes/${testRecipeId}`)
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Recipe deleted successfully");

    //verify the recipe was actually deleted from the database 
    const dbResult = await pool.query(
      "SELECT id FROM recipes WHERE id = $1",
      [testRecipeId]
    );

    expect(dbResult.rows.length).toBe(0);
  });

  //return 400 for invalid recipe id
  it("returns 400 for invalid recipe id", async () => {
    const res = await api.delete("/api/recipes/invalid-id")
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid recipe id");
  });

  //return 404 for nonexistent recipe
  it("returns 404 for nonexistent recipe id", async () => {
    const res = await api.delete("/api/recipes/9999")
      .set("x-test-user-email", testUser.email);
    
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Recipe not found");
  });

  //cascades delete related data
  it("cascades delete related data", async () => {
    //create some related data first
    await pool.query(`
      INSERT INTO ratings (user_id, recipe_id, rating)
      VALUES ($1, $2, $3)`,
      [otherUser.id, testRecipeId, 5]
    );

    await pool.query(`
      INSERT INTO comments (user_id, recipe_id, comment)
      VALUES ($1, $2, $3)`,
      [otherUser.id, testRecipeId, "Great recipe!"]
    );

    await pool.query(`
      INSERT INTO saved_recipes (user_id, recipe_id)
      VALUES ($1, $2)`,
      [otherUser.id, testRecipeId]
    );

    //delete the recipe
    const res = await api.delete(`/api/recipes/${testRecipeId}`)
      .set("x-test-user-email", testUser.email);

    expect(res.status).toBe(200);

    //verify all the related data was deleted
    const ratingResult = await pool.query(
      "SELECT id FROM ratings WHERE recipe_id = $1",
      [testRecipeId]
    );
    expect(ratingResult.rows.length).toBe(0);

    const commentResult = await pool.query(
      "SELECT id FROM comments WHERE recipe_id = $1",
      [testRecipeId]
    );
    expect(commentResult.rows.length).toBe(0);

    const savedResult = await pool.query(
      "SELECT user_id FROM saved_recipes WHERE recipe_id = $1",
      [testRecipeId]
    );
    expect(savedResult.rows.length).toBe(0);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE id in ($1, $2)", [testUser.id, otherUser.id]);
    await pool.end();
  });
});