import { NextRequest, NextResponse } from 'next/server'; //incoming http request data + sends response back to client
import { getServerSession } from "next-auth"; //check if user is logged in

import pool from "@/lib/db"; //runs database queries to save/retrieve data

import { authOptions } from "../auth/[...nextauth]/authOptions";

//NextRequest
//gets the http request from frontend, when user clicks create recipe
//contains recipe data (title, ingredients, steps) in request body
//+headers, cookies

//getServerSession + authOptions 
//security check if user is logged in by looking at their session
//returns 401 error, request stops here if not logged in
//continue if logged in

//pool (database)
//validates the recipe data, checks if title exists, ingredients not empty
//return 400 error if validation fails
//insert recipe into db if validation passes
//gets the user ID from the session to link the recipe to them

//NextResponse 
//return 201 status with new recipe data if successful
//return error status if error
//frontend/client receives this response 

//GET - fetch all recipes with author names for the homepage
export async function GET() {
  try {
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
      ORDER BY recipe.created_at DESC
    `);

    return NextResponse.json({
      recipes: result.rows
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

//POST - create new recipes with
//authentication verification, input validation, database insertion, return created recipe data
export async function POST(request: NextRequest) {
  try {
    //get req data
    const { title, imageUrl, ingredients, steps } = await request.json();

    //check authentication
    const session = await getServerSession(authOptions);
    if(!session?.user?.email) {
      return NextResponse.json( 
        { error: "Authentication required" },
        { status: 401 }
      );   
    }

    //validate the data
    if(!title || !ingredients || !steps) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    //if submitted with empty title/array of ingredient/step
    if(typeof title !== "string" || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "Invalid data format"},
        { status: 400 }
      );
    }

    if(title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required " },
        { status: 400 }
      );
    }

    //filter out empty ingredients and steps
    const validIngredients = ingredients.filter(ingredient => ingredient.trim());
    const validSteps = steps.filter(step => step.trim());

    if(validIngredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient required" },
        { status: 400 }
      );
    }

    if(validSteps.length === 0) {
      return NextResponse.json(
        { error: "At least one step required" },
        { status: 400 }
      );
    }

    //process with database
    //get user id from session
    const user = await pool.query(
      "SELECT id FROM users WHERE email = $1", 
      [session.user.email]
    );

    if(user.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = user.rows[0].id;

    //insert recipe into database
    const result = await pool.query(`
      INSERT INTO recipes (author_id, title, image_url, ingredients, steps)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, image_url, ingredients, steps, created_at`,
      [userId, title.trim(), imageUrl?.trim() || null, validIngredients, validSteps]
    );

    const newRecipe = result.rows[0];

    return NextResponse.json(
      {
        message: "Recipe created successfully",
        recipe: newRecipe
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating recipe: ", error); 
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}