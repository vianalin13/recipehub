import { test, expect } from "@playwright/test";
import bcrypt from "bcrypt";
import { Pool } from "pg";

test.describe.configure({ mode: 'serial' });

test.describe("Registration", () => {
  let pool: Pool;
  let username: string;
  let email: string;
  const password = "password123";

  test.beforeAll(async () => {
    pool = new Pool({ 
      connectionString: process.env.POSTGRES_URL,
      application_name: 'register-tests'
    });
  });

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 11);
    username = `registeruser${timestamp}-${randomId}`;
    email = `registeruser${timestamp}-${randomId}@example.com`;
    await page.goto("/register");
  });
  
  //should display registration form
  test("should display registration form", async ({page}) => {
    await expect(page.getByRole("heading", {name: "Create Account"})).toBeVisible();
    await expect(page.getByLabel("username")).toBeVisible();
    await expect(page.getByLabel("email")).toBeVisible();
    await expect(page.getByLabel("password")).toBeVisible();
    await expect(page.getByRole("button", {name: "Register"})).toBeVisible();

  });
  
  //should register successfully with valid username/email/pw
  test("should register successfully with valid username/email/password", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL("/login"); //redirect to login
  }); 
  
  //should not register successfully with invalid username (already exists)
  test("should not register successfully with invalid username (already exists)", async ({ page }) => {
    // Insert the user to create a duplicate
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );

    //add a small delay to ensure the database operation completes
    await page.waitForTimeout(100);

    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill("newemail@example.com");
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await page.waitForTimeout(2000);
    const error = page.locator('[data-testid="register-error"]');
    await expect.poll(async () => await error.isVisible(), { timeout: 10000 }).toBe(true);
    await expect(error).toContainText("User already exists");
    await expect(page).toHaveURL("/register");
  });

  //should not register successfully with invalid email (already exists)
  test("should not register successfully with invalid email (already exists)", async ({page}) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );

    await page.getByLabel("username").fill("newuser");
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page.getByTestId("register-error")).toHaveText("User already exists");
    await expect(page).toHaveURL("/register");
  });

  //should not register successfully with invalid email (not @gmail.com/yahoo.com/...)
  test("should not register successfully with invalid email format", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill("new-email");
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL("/register");
  });

  //should not register successfully with empty username
  test("should not register successfully with empty username", async ({page}) => {
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL("/register");
    const usernameInput = page.getByLabel("username");
    await expect(usernameInput).toBeFocused();
  }); 

  //should not register successfully with empty email
  test("should not register successfully with empty email", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL("/register");
    const emailInput = page.getByLabel("email");
    await expect(emailInput).toBeFocused();
  }); 

  //should not register successfully with empty password
  test("should not register successfully with empty password", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill(email);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL("/register");
    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeFocused();
  }); 

  //should show loading state during registration
  test("should show loading screen during registration", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page.getByRole("button", {name: "Creating Account..."})).toBeVisible();
  });

  //should disable form during loading
  test("should disable form during loading", async ({page}) => {
    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();

    await expect(page.getByLabel("username")).toBeDisabled();
    await expect(page.getByLabel("email")).toBeDisabled();
    await expect(page.getByLabel("password")).toBeDisabled();
    await expect(page.getByRole("button", {name: "Creating Account..."})).toBeDisabled();
  });

  //should clear error message on new submission
  test("should clear error message on new submission", async ({page}) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );
    
    await page.getByLabel("username").fill(username);
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();

    await expect(page.getByTestId("register-error")).toHaveText("User already exists");

    //clear form and try with new data 
    await page.getByLabel("username").fill("newuser123");
    await page.getByLabel("email").fill("newuser123@example.com");
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", {name: "Register"}).click();
    await expect(page).toHaveURL("/login");
  });

  test.afterAll(async () => {
    //clean up after all tests
    await pool.query("DELETE FROM users WHERE username LIKE 'registeruser%' OR username LIKE 'newuser%'");
    await pool.end();
  });
});