import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import pool from "@/lib/db";

import { authOptions } from "../../auth/[...nextauth]/authOptions";

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

    //get request data
    const { title, imageUrl, ingredients, steps } = await request.json();

    //check authentication
    const session = await getServerSession(authOptions);

    if(!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    //validate data
    if(title === null || title === undefined || !ingredients || !steps) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    //validate required fields type
    if(typeof title !== "string" || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    //validate imageurl if provided
    if(imageUrl !== null && imageUrl !== undefined && typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    //check for empty title after type validation
    if(title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const validIngredients = ingredients.filter(ingredient => ingredient.trim());
    const validSteps = steps.filter(step => step.trim());

    if(validIngredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient required"},
        { status: 400 }
      );
    }

    if(validSteps.length === 0) {
      return NextResponse.json(
        { error: "At least one step required" },
        { status: 400 }
      );
    }

    //get user id from session
    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [session.user.email]
    );

    if(user.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404}
      );
    }

    const userId = user.rows[0].id;

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
      `, [title.trim(), imageUrl?.trim() || null, validIngredients, validSteps, recipeId, userId]
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