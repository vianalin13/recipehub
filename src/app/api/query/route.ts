import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const result = await sql`
      SELECT
        recipes.title,
        recipes.ingredients,
        recipes.steps,
        users.username
      FROM recipes
      JOIN users ON recipes.user_id = users.id
      LIMIT 5;
    `;

    return NextResponse.json({data: result.rows })

  } catch(error) {
    console.error(`Query error: ${error}`);
    return NextResponse.json({error: "Query failed"}, {status: 500});
  }
}