import { Pool } from "pg";
import request from "supertest";

const api = request("http://localhost:3000");
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

describe("POST /api/auth/register - User Registration", () => {
  it("registers a new user", async () => {
    const res = await api.post("/api/auth/register").send({
      username: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`, 
      password: "password123"
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("username");
    expect(res.body.user).toHaveProperty("email");
  });


  it("does not allow duplicate usernames or emails", async () => {
    const unique = Date.now();

    //register once
    await api.post("/api/auth/register").send({
      username: `dupuser_${unique}`,
      email: `dupuser_${unique}@example.com`,
      password: "password123"
    });

    //register again
    const res = await api.post("/api/auth/register").send({
      username: `dupuser_${unique}`,
      email: `dupuser_${unique}@example.com`,
      password: "password123"
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
    const res = await api.post("/api/auth/register").send({
      username: `extrafield_${Date.now()}`,
      email: `extrafield_${Date.now()}@example.com`,
      password: "password123",
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
    const res = await api.post("/api/auth/register").send({
      username: `${longUsername}_${Date.now()}`,
      email: `dberror${Date.now()}@example.com`,
      password: "password123"
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/internal server error/i);
  });

  it("stores the hashed password in the database", async () => {
    const username = `hashuser_${Date.now()}`;
    const email = `hashuser_${Date.now()}@example.com`;
    const plainPassword = "password123";

    //check if registered successfully
    const registered = await api.post("/api/auth/register").send({
      username, 
      email,
      password: plainPassword
    });
    expect(registered.status).toBe(200);

    //check if pw is hashed
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
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