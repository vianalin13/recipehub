import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username VARCHAR(100),
      email VARCHAR(100)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS recipes(
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        ingredients TEXT[],
        steps TEXT[],
        user_id INTEGER REFERENCES users(id)
      );
    `;

    await sql`
      INSERT INTO users(username, email)
      VALUES('testuser', 'test@example.com')
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO recipes(title, ingredients, steps, user_id)
      VALUES(
        'Rice',
        Array['1 cup rice', '2 cups water'],
        Array['Boil water', 'Add rice', 'Simmer 20 minutes'],
        1
      )
      ON CONFLICT DO NOTHING;
    `;

    return NextResponse.json({message: "Database seeded successfully"});

  } catch(error) {
    console.error(`Seeding error: ${error}`);
    return NextResponse.json({error: "Seeding failed"}, {status: 500});
  }
}