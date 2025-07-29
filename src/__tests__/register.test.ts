import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

//test constants for better maintainability
const TEST_PASSWORD = "password123";

describe("POST /api/auth/register - User Registration", () => {
  //increase timeout for entire test
  jest.setTimeout(60000); // 60 seconds
  
  let timestamp: number;
  let random: string;
  
  beforeEach(() => {
    timestamp = Date.now();
    random = Math.random().toString(36).substring(7);
  });
  
  const generateTestUser = () => ({
    username: `testuser_${timestamp}_${random}`,
    email: `testuser_${timestamp}_${random}@example.com`
  });
  
  it("registers a new user", async () => {
    const testUser = generateTestUser();
    const res = await api.post("/api/auth/register").send({
      ...testUser,
      password: TEST_PASSWORD
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("username");
    expect(res.body.user).toHaveProperty("email");
  });

  it("does not allow duplicate usernames or emails", async () => {
    const testUser = generateTestUser();

    //register once
    await api.post("/api/auth/register").send({
      ...testUser,
      password: TEST_PASSWORD
    });

    //register again
    const res = await api.post("/api/auth/register").send({
      ...testUser,
      password: TEST_PASSWORD
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("returns error for missing fields", async () => {
    const res = await api.post("/api/auth/register").send({
      username: "",
      email: "",
      password: ""
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required fields/i);
  });

  it("ignores extra/unexpected fields", async () => {
    const testUser = generateTestUser();
    const res = await api.post("/api/auth/register").send({
      ...testUser,
      password: TEST_PASSWORD,
      isAdmin: true,
      gender: "female",
    });
    expect(res.status).toBe(200);
    expect(res.body.user).not.toHaveProperty("isAdmin");
    expect(res.body.user).not.toHaveProperty("gender");
  });

  it("returns 500 if database error occurs", async () => {
    //username exceeds 255
    const longUsername = "a".repeat(256);
    const testUser = generateTestUser();
    const res = await api.post("/api/auth/register").send({
      username: `${longUsername}_${timestamp}_${random}`,
      email: testUser.email,
      password: TEST_PASSWORD
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/internal server error/i);
  });

  it("stores the hashed password in the database", async () => {
    const testUser = generateTestUser();
    const plainPassword = TEST_PASSWORD;

    //check if registered successfully
    const registered = await api.post("/api/auth/register").send({
      ...testUser,
      password: plainPassword
    });
    expect(registered.status).toBe(200);

    //check if pw is hashed
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [testUser.username]
      );
      expect(result.rows.length).toBe(1);
      
      const dbUser = result.rows[0];
      expect(dbUser.password).not.toBe(plainPassword);
      expect(dbUser.password.length).toBeGreaterThan(20); //bcrypt hashes are long
    } catch (error) {
      console.error("db query error:", error);
      if (error instanceof AggregateError) {
        for (const err of error.errors) {
          console.error("Inner error:", err);
        }
      }
      throw error;
    }
  });

  afterAll(async () => {
    await pool.end();
  });
});