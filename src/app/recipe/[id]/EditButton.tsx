"use client";

import { useRouter } from "next/navigation";

interface EditButtonProps {
  recipeId: number;
}

export default function EditButton({ recipeId }: EditButtonProps) {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.push(`/recipe/${recipeId}/edit`)}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
    >
      Edit Recipe
    </button>
  );
}