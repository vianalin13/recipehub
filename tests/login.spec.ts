import {test, expect} from "@playwright/test";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

test.describe("Login", () => {
  let username: string;
  let email: string;
  const password = "password123";

  test.beforeAll(async () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    username = `loginuser${timestamp}-${randomId}`;
    email = `loginuser${timestamp}-${randomId}@example.com`;
      
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );
  });

  test.beforeEach(async ({page}) => {
    await page.goto("/login");
  });

  test("should display login form", async ({page}) => {
    await expect(page.getByRole("heading", {name: "Login"})).toBeVisible();
    await expect(page.getByLabel("username")).toBeVisible();
    await expect(page.getByLabel("password")).toBeVisible();
    await expect(page.getByRole("button", {name: "Login"})).toBeVisible();
  });

  test("should login successfully with valid username", async ({page}) => {
    //fill in login
    await page.getByLabel("username").fill(username);
    await page.getByLabel("password").fill(password);
    //click login button
    await page.getByRole("button", {name: "Login"}).click();
    //expect redirect to homepage
    await expect(page).toHaveURL("/");
  });

  test("should login successfully with valid email", async ({page}) => {
    await page.getByLabel("username").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Login"}).click();
    await expect(page).toHaveURL("/");
  });

  test("should not login successfully with invalid username/email", async ({page}) => {
    await page.getByLabel("username").fill("wronguser");
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Login"}).click();
    
    //wait for the error message to appear with a longer timeout
    await expect(page.getByText("Invalid username or password")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL("/login");
  });

  test("should not login successfully with wrong password", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("password").fill("wrongpassword");
    await page.getByRole("button", {name: "Login"}).click();
    
    //wait for the error message to appear with a longer timeout
    await expect(page.getByText("Invalid username or password")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL("/login");
  });

  test("should not login successfully with empty username", async ({page}) => {
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Login"}).click();
    await expect(page).toHaveURL("/login"); //stay on login page
    const usernameInput = page.getByLabel("username");
    await expect(usernameInput).toBeFocused();
  });

  test("should not login successfully with empty password", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByRole("button", {name: "Login"}).click();
    await expect(page).toHaveURL("/login"); //stay on login page
    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeFocused();
  });

  test("should show loading state during login", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Login"}).click();
    //should show loading 
    await expect(page.getByRole("button", {name: "Logging in..."})).toBeVisible();
  });

  test("should disable form during loading", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Login"}).click();
    //form inputs should be disabled
    await expect(page.getByLabel('username')).toBeDisabled();
    await expect(page.getByLabel('password')).toBeDisabled();
    //tobedisabled -> button visible but can't be clicked on
    await expect(page.getByRole('button', { name: "Logging in..." })).toBeDisabled();
  });

  test.afterAll(async () => {
    await pool.query(
      "DELETE FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    await pool.end();
  });
});