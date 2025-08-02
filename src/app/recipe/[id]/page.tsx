"use client";

/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import RatingStars from "@/components/RatingStars";

import DeleteButton from "./DeleteButton";
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

export default function RecipeIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [userRating, setUserRating] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const { id } = await params;
        
        if (isNaN(Number(id))) {
          notFound();
        }

        const res = await fetch(`/api/recipes/${id}`);
        
        if (res.status === 404) {
          notFound();
        }

        if (!res.ok) {
          throw new Error('Failed to load recipe');
        }

        const data = await res.json();
        const recipeData: Recipe = data.recipe;
        setRecipe(recipeData);

        //check if user is author
        if (session?.user?.email) {
          const userRes = await fetch(`/api/users?email=${session.user.email}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            const userId = userData.user.id;
            setIsAuthor(userId === recipeData.author_id);

            //get user's rating
            const ratingRes = await fetch(`/api/recipes/${id}/ratings`);
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              setUserRating(ratingData.userRating);
            }
          }
        }
      } catch (error) {
        console.error('Error loading recipe:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [params, session]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!recipe) {
    return <div className="p-8 text-red-600">Failed to load recipe</div>;
  }
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <p className="text-gray-600"> By {recipe.author_name}</p>
        </div>
        {isAuthor && (
          <div className="flex gap-3">
            <EditButton recipeId={recipe.id} />
            <DeleteButton recipeId={recipe.id} recipeTitle={recipe.title} />
          </div>
        )}
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

      <div className="mt-6">
        <RatingStars
          recipeId={recipe.id}
          averageRating={recipe.average_rating}
          ratingCount={recipe.rating_count}
          userRating={userRating}
          />
      </div>
    </div>
  );
}