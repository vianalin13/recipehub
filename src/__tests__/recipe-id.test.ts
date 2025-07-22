import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

describe("GET /api/recipes/:id", () => {
  let userId: number;
  let recipeWithImageId: number;
  let recipeWithoutImageId: number;

  beforeAll(async () => {
    //create a test user
    const userRes = await pool.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      ["createrecipeid", "createrecipeid@example.com", "hashedpassword"]
    );

    userId = userRes.rows[0].id; //cuz returns {rows: [{id:123}], ...}

    //create a test recipe with image_url
    const recipeWithImageRes = await pool.query(`
      INSERT INTO recipes (author_id, title, image_url, ingredients, steps)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [userId, "Recipe With Image", "https://example.com/image.jpg", ["ingredient1", "ingredient 2"], ["step 1", "step 2", "step 3"]]
    );
    recipeWithImageId = recipeWithImageRes.rows[0].id;

    //create a test recipe without image_url
    const recipeWithoutImageRes = await pool.query(`
      INSERT INTO recipes (author_id, title, ingredients, steps)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [userId, "Recipe Without Image", ["ingredient1", "ingredient 2"], ["step 1", "step 2", "step 3"]]
    );
    recipeWithoutImageId = recipeWithoutImageRes.rows[0].id;
  });

  //returns 200 and recipe data for valid id
  it("returns 200 and recipe data with image_url", async () => {
    const res = await api.get(`/api/recipes/${recipeWithImageId}`);
    expect(res.status).toBe(200);
    expect(res.body.recipe).toHaveProperty("id", recipeWithImageId);
    expect(res.body.recipe).toHaveProperty("title", "Recipe With Image");
    expect(res.body.recipe).toHaveProperty("image_url", "https://example.com/image.jpg");
    expect(res.body.recipe).toHaveProperty("ingredients", ["ingredient1", "ingredient 2"]);
    expect(res.body.recipe).toHaveProperty("steps", ["step 1", "step 2", "step 3"]);
  }); 

  it("returns 200 and recipe data without image_url", async () => {
    const res = await api.get(`/api/recipes/${recipeWithoutImageId}`);
    expect(res.status).toBe(200);
    expect(res.body.recipe).toHaveProperty("id", recipeWithoutImageId);
    expect(res.body.recipe).toHaveProperty("title", "Recipe Without Image");
    expect(res.body.recipe.image_url).toBeNull();
    expect(res.body.recipe).toHaveProperty("ingredients", ["ingredient1", "ingredient 2"]);
    expect(res.body.recipe).toHaveProperty("steps", ["step 1", "step 2", "step 3"]);
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
