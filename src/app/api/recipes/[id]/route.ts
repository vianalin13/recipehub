import { NextRequest, NextResponse } from "next/server";

import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: "Invalid recipe id" },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      SELECT
        recipes.id,
        recipes.title,
        recipes.image_url,
        recipes.ingredients,
        recipes.steps,
        recipes.average_rating,
        recipes.rating_count,
        recipes.created_at,
        recipes.updated_at,
        users.username as author_name
      FROM recipes
      JOIN users ON recipes.author_id = users.id
      WHERE recipes.id = $1
      LIMIT 1
    `, [recipeId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { recipe: result.rows[0] }
    );
  } catch (error) {
    console.error("Error fetching recipe by id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}