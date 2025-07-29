import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

//test constants for better maintainability
const TEST_PASSWORD = "hashedpassword";
const TEST_RECIPE_WITH_IMAGE = {
  title: "Recipe With Image",
  imageUrl: "https://example.com/image.jpg",
  ingredients: ["ingredient1", "ingredient 2"],
  steps: ["step 1", "step 2", "step 3"]
};

const TEST_RECIPE_WITHOUT_IMAGE = {
  title: "Recipe Without Image",
  ingredients: ["ingredient1", "ingredient 2"],
  steps: ["step 1", "step 2", "step 3"]
};

describe("GET /api/recipes/:id", () => {
  //increase timeout for entire test
  jest.setTimeout(60000); // 60 seconds
  
  let userId: number;
  let recipeWithImageId: number;
  let recipeWithoutImageId: number;

  beforeAll(async () => {
    //create a test user
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const userRes = await pool.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [`testuser_${timestamp}_${random}`, `testuser_${timestamp}_${random}@example.com`, TEST_PASSWORD]
    );

    userId = userRes.rows[0].id; //cuz returns {rows: [{id:123}], ...}

    //create a test recipe with image_url
    const recipeWithImageRes = await pool.query(`
      INSERT INTO recipes (author_id, title, image_url, ingredients, steps)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [userId, TEST_RECIPE_WITH_IMAGE.title, TEST_RECIPE_WITH_IMAGE.imageUrl, TEST_RECIPE_WITH_IMAGE.ingredients, TEST_RECIPE_WITH_IMAGE.steps]
    );
    recipeWithImageId = recipeWithImageRes.rows[0].id;

    //create a test recipe without image_url
    const recipeWithoutImageRes = await pool.query(`
      INSERT INTO recipes (author_id, title, ingredients, steps)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [userId, TEST_RECIPE_WITHOUT_IMAGE.title, TEST_RECIPE_WITHOUT_IMAGE.ingredients, TEST_RECIPE_WITHOUT_IMAGE.steps]
    );
    recipeWithoutImageId = recipeWithoutImageRes.rows[0].id;
  }, 30000); // 30 second timeout for beforeAll

  //returns 200 and recipe data for valid id
  it("returns 200 and recipe data with image_url", async () => {
    const res = await api.get(`/api/recipes/${recipeWithImageId}`);
    expect(res.status).toBe(200);
    expect(res.body.recipe).toHaveProperty("id", recipeWithImageId);
    expect(res.body.recipe).toHaveProperty("title", TEST_RECIPE_WITH_IMAGE.title);
    expect(res.body.recipe).toHaveProperty("image_url", TEST_RECIPE_WITH_IMAGE.imageUrl);
    expect(res.body.recipe).toHaveProperty("ingredients", TEST_RECIPE_WITH_IMAGE.ingredients);
    expect(res.body.recipe).toHaveProperty("steps", TEST_RECIPE_WITH_IMAGE.steps);
  }); 

  it("returns 200 and recipe data without image_url", async () => {
    const res = await api.get(`/api/recipes/${recipeWithoutImageId}`);
    expect(res.status).toBe(200);
    expect(res.body.recipe).toHaveProperty("id", recipeWithoutImageId);
    expect(res.body.recipe).toHaveProperty("title", TEST_RECIPE_WITHOUT_IMAGE.title);
    expect(res.body.recipe.image_url).toBeNull();
    expect(res.body.recipe).toHaveProperty("ingredients", TEST_RECIPE_WITHOUT_IMAGE.ingredients);
    expect(res.body.recipe).toHaveProperty("steps", TEST_RECIPE_WITHOUT_IMAGE.steps);
  }); 

  //returns 404 for nonexistent id
  it("returns 404 for non-existent id", async () => {
    const res = await api.get(`/api/recipes/999999`);
    expect(res.status).toBe(404);
  });

  //returns 400 for invalid id
  it("returns 400 for invalid id", async () => {
    const res = await api.get(`/api/recipes/invalid`);
    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    await pool.end();
  });
});
