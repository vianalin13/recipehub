import bcrypt from "bcrypt";
import { Pool } from "pg";

import { authOptions } from "../app/api/auth/[...nextauth]/authOptions";

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const authorizeFunction = authOptions.providers.find(
  (provider) => provider.id === "credentials"
)?.options?.authorize;

if (!authorizeFunction) {
  throw new Error("custom authorize function not found on credentials provider");
}

const username = `authuser${Date.now()}`;
const email = `authuser${Date.now()}@example.com`;
const password = "password123";

beforeAll(async () => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
    [username, email, hashedPassword]
  );
});

describe("NextAuth authorize", () => {
  it("logs in with correct username and password", async () => {      
    const user = await authorizeFunction({
      username,
      password,
    });
    expect(user).toBeTruthy();
    expect(user).toHaveProperty("name", username);
    expect(user).toHaveProperty("email", email);
  });

  it("logs in with correct email and password", async () => {
    const user = await authorizeFunction({
      username: email,
      password,
    });
    expect(user).toBeTruthy();
    expect(user).toHaveProperty("name", username);
    expect(user).toHaveProperty("email", email);
  });

  it("fails with wrong password", async () => {
    const user = await authorizeFunction({
      username,
      password: "wrongpassword",
    });
    expect(user).toBeNull();
  });

  it("fails with nonexistent user", async () => {
    const user = await authorizeFunction({
      username: "nonexistentuser",
      password: "password123",
    });
    expect(user).toBeNull();
  });

  it("fails with missing username", async () => {
    const user = await authorizeFunction({
      username: "",
      password: password,
    });
    expect(user).toBeNull();
  });

  it("fails with missing password", async () => {
    const user = await authorizeFunction({
      username,
      password: "",
    });
    expect(user).toBeNull();
  });

  afterAll(async () => {
    await pool.end();
  });
});

