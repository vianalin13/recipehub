/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import pool from "@/lib/db";

import EditButton from "./EditButton";

interface Recipe {
  id: number;
  title: string;
  image_url?: string;
  ingredients: string[];
  steps: string[];
  average_rating?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_id: number;
}

export default async function RecipeIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (isNaN(Number(id))) {
    notFound();
  }

  //get session for author verifcation
  const session = await getServerSession(authOptions);

  //use absolute URL for server-side fetches
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/recipes/${id}`, {
    cache: "no-store",
  });

  if(res.status === 404) {
    notFound();
  }

  if(!res.ok) {
    return <div className="p-8 text-red-600">Failed to load recipe</div>;
  }

  const data = await res.json();
  const recipe: Recipe = data.recipe;

  let isAuthor = false;
  if(session?.user?.email) {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [session.user.email]
    );
    isAuthor = userResult.rows.length > 0 && userResult.rows[0].id === recipe.author_id;
  }
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <p className="text-gray-600"> By {recipe.author_name}</p>
        </div>
        {isAuthor && <EditButton recipeId={recipe.id} />}
      </div>
    
      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          style={{ 
            width: "100%", 
            maxHeight: "24rem", 
            objectFit: "cover", 
            borderRadius: "0.5rem", 
          }}
        />
      )}

      <div className="mb-4">
        <div className="text-sm text-gray-500">
          Created: {new Date(recipe.created_at).toLocaleString()}
        </div>
        {recipe.updated_at !== recipe.created_at && (
          <div className="text-sm text-gray-500">
            Updated: {new Date(recipe.updated_at).toLocaleString()}
          </div>
        )}
      </div>

      <div className="pl-6">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i} className="flex items-center gap-2">
              <span>&#8226;</span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-semibold mt-8">Steps</h2>
        <ol className="space-y-2">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-bold">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {typeof recipe.average_rating === "number" && (
        <div className="mt-4">Average Rating: {recipe.average_rating.toFixed(2)} ({recipe.rating_count || 0} ratings)</div>
      )}
    </div>
  );
}