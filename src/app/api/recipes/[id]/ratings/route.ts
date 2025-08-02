import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import db from "@/lib/db";

import { authOptions } from "../../../auth/[...nextauth]/authOptions";

interface RatingRow {
  rating: number;
  created_at: string;
  username: string;
  email: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id:string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if(!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    const recipeId = parseInt(id);
    if(isNaN(recipeId)) {
      return NextResponse.json(
        { error: "Invalid recipe ID" },
        { status: 400 }
      );
    }

    const { rating } = await request.json();
    if(!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid rating value" },
        { status: 400}
      );
    }

    const recipeResult = await db.query(
      "SELECT * FROM recipes WHERE id = $1", 
      [recipeId]
    );
    if(recipeResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    //get user id
    const userResult = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [session.user.email]
    );
    if(userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    const userId = userResult.rows[0].id;

    const upsertResult = await db.query(`
      INSERT INTO ratings (user_id, recipe_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, recipe_id)
      DO UPDATE SET rating = $3, updated_at = NOW()
      RETURNING *`,
      [userId, recipeId, rating]);

    const ratingsResult = await db.query(
      "SELECT rating FROM ratings WHERE recipe_id = $1",
      [recipeId]
    );
    const ratings = ratingsResult.rows;

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratings.length
      : 0;
     
    return NextResponse.json({
      rating: upsertResult.rows[0].rating,
      averageRating: averageRating,
      ratingCount: ratings.length
    });

  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json( 
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const recipeId = parseInt(id);

    if(isNaN(recipeId)) {
      return NextResponse.json( 
        { error: "Invalid recipe ID" },
        { status: 400 }
      );
    }

    //get all ratings for recipe w user info
    const ratingsResult = await db.query(`
      SELECT ratings.rating, ratings.created_at, users.username, users.email
      FROM ratings
      JOIN users ON ratings.user_id = users.id
      WHERE ratings.recipe_id = $1
      ORDER BY ratings.created_at DESC`,
      [recipeId]
    );

    const averageRating = ratingsResult.rows.length > 0
      ? ratingsResult.rows.reduce((sum: number, r: RatingRow) => sum + r.rating, 0) / ratingsResult.rows.length
      : null;

    let userRating = null;
    if(session?.user?.email) {
      const userResult = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [session.user.email]
      );

      if(userResult.rows.length > 0) {
        const userRatingResult = await db.query(
          "SELECT rating FROM ratings WHERE user_id = $1 AND recipe_id = $2",
          [userResult.rows[0].id, recipeId]
        );
        userRating = userRatingResult.rows.length > 0 
          ? userRatingResult.rows[0].rating 
          : null;
      }
    }

    return NextResponse.json({
      ratings: ratingsResult.rows,
      averageRating: averageRating,
      ratingCount: ratingsResult.rows.length,
      userRating: userRating
    });

  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}