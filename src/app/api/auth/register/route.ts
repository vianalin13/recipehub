import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

import pool from "@/lib/db";

//define PostgreSQL error interface for type safety
interface PostgreSQLError {
  code: string;
  constraint?: string;
  message?: string;
  detail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    //validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    //check if user alr exists
    const existingUser = await pool.query(`
      SELECT *
      FROM users
      WHERE username = $1 OR email = $2
      `,
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //insert newly created user to db
    const result = await pool.query(`
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email
      `,
      [username, email, hashedPassword]
    );

    const newUser = result.rows[0];

    return NextResponse.json({
      message: "User registration successful",
      user: newUser,
    });
  } catch (error) {
    console.error(`Registration error: ${error}`);
    //handle PostgreSQL duplicate key errors with proper typing
    if ((error as PostgreSQLError)?.code === '23505') {
      if ((error as PostgreSQLError).constraint === 'users_username_key') {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
      if ((error as PostgreSQLError).constraint === 'users_email_key') {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}