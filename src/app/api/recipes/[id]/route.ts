import { NextRequest, NextResponse } from "next/server";

import { getUserIdFromSession } from "@/lib/auth-helpers";
import pool from "@/lib/db";
import { validateRecipeData } from "@/lib/validation";

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
        users.username as author_name,
        users.id as author_id
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const requestData = await request.json();

    //validate recipe data
    const validation = validateRecipeData(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    //get user ID from session
    const authResult = await getUserIdFromSession(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === "Authentication required" ? 401 : 404 }
      );
    }

    const { validatedData, userId } = { validatedData: validation.validatedData!, userId: authResult.userId! };

    //check if recipe exists and user is the author
    const existingRecipe = await pool.query(
      "SELECT author_id FROM recipes WHERE id = $1",
      [recipeId]
    );

    if(existingRecipe.rows.length === 0) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    if(existingRecipe.rows[0].author_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - you can only edit your own recipes" },
        { status: 403}
      );
    }

    //update recipe in database
    const result = await pool.query(`
      UPDATE recipes
      SET title = $1, image_url = $2, ingredients = $3, steps = $4, updated_at = NOW()
      WHERE id = $5 AND author_id = $6
      RETURNING id, title, image_url, ingredients, steps, created_at, updated_at
      `, [validatedData.title, validatedData.imageUrl, validatedData.ingredients, validatedData.steps, recipeId, userId]
    );

    const updatedRecipe = result.rows[0];

    return NextResponse.json(
      {
        message: "Recipe updated successfully",
        recipe: updatedRecipe
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating recipe: ", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}