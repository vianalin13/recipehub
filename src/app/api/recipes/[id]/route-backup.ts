import  { NextRequest, NextResponse } from "next/server";

import pool from "@/lib/db";

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{id: string}> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if(isNaN(recipeId)) {
      return NextResponse.json(
        { error: "Invalid recipe id" },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      SELECT
        recipe.id, 
        recipe.title,
        recipe.image_url,
        recipe.ingredients,
        recipe.steps,
        recipe.average_rating,
        recipe.rating_count,
        recipe.created_at,
        recipe.updated_at,
        user.username as author_name
      FROM recipes recipe
      JOIN users user ON recipe.author_id = user.id
      WHERE recipe.id = $1
      LIMIT 1
    `, [recipeId]);

    if(result.rows.length === 0) {
      return NextResponse.json( 
        { error: "Recipe not found"},
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