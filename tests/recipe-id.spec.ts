import { Pool } from "pg";
import { test, expect, request as pwRequest } from "playwright/test";

let pool: Pool;

let userId: number;
let recipeWithImageId: number;
let recipeWithoutImageId: number;

test.describe("Recipe Detail Page", () => {
  test.beforeAll(async() => {
    pool = new Pool({ 
      connectionString: process.env.POSTGRES_URL,
      application_name: 'login-tests'
    });

    const api = await pwRequest.newContext();

    //test user
    const unique = Date.now() + Math.random(); //parallel execution, could get the same Date if test suits run fast enough
    const userRes = await api.post("/api/auth/register", {
      data: {
        username: `pwtestuser${unique}`,
        email: `pwtestuser${unique}@example.com`,
        password: "password123"
      }
    });
    const userJson = await userRes.json();
    if (!userJson.user) {
      throw new Error(`User registration failed: ${JSON.stringify(userJson)}`);
    }
    const user = userJson.user;
    userId = user.id;
    
    //create recipe w image url
    const recipeWithImageRes = await api.post("/api/recipes", {
      data: { 
        title: "Playwright Recipe With Image",
        imageUrl: "https://example.com/image.jpg",
        ingredients: ["ingredient 1", "ingredient 2"],
        steps: ["step 1", "step 2", "step 3"]
      },
      headers: {
        "x-test-user-email": user.email
      }
    });
    recipeWithImageId = (await recipeWithImageRes.json()).recipe.id;

    const recipeWithoutImageRes = await api.post("/api/recipes", {
      data: { 
        title: "Playwright Recipe Without Image",
        ingredients: ["ingredient 1", "ingredient 2"],
        steps: ["step 1", "step 2", "step 3"]
      },
      headers: {
        "x-test-user-email": user.email
      }
    });
    recipeWithoutImageId = (await recipeWithoutImageRes.json()).recipe.id;

    await api.dispose();
  });

  //show recipe details for valid id
  test("shows recipe details for valid id (with imageurl)", async ({page}) => {
    await page.goto(`/recipe/${recipeWithImageId}`);
    await expect(page.getByRole("heading", {name: /ingredients/i})).toBeVisible();
    await expect(page.getByText(/ingredient 1/i)).toBeVisible();
    await expect(page.getByRole("heading", {name: /steps/i})).toBeVisible();
    await expect(page.getByText(/step 1/i)).toBeVisible();
    await expect(page.getByRole("img", { name: "Playwright Recipe With Image" })).toBeVisible();
  });

  test("shows recipe details for valid id (without imageurl)", async ({page}) => {
    await page.goto(`/recipe/${recipeWithoutImageId}`);
    await expect(page.getByRole("heading", {name: /ingredients/i})).toBeVisible();
    await expect(page.getByText(/ingredient 1/i)).toBeVisible();
    await expect(page.getByRole("heading", {name: /steps/i})).toBeVisible();
    await expect(page.getByText(/step 1/i)).toBeVisible();
    await expect(page.locator('img[alt="Playwright Recipe With Image"]')).toHaveCount(0);
  });

  
  //shows not found for invalid id
  test("shows not found for invalid id", async ({page}) => {
    await page.goto("/recipe/999999");
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('This page could not be found.')).toBeVisible();
  });

  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    await pool.end();
  });
});

