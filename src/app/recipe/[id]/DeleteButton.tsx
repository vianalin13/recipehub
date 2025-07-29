"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteButtonProps {
  recipeId: number;
  recipeTitle: string;
}

export default function DeleteButton({ recipeId, recipeTitle }: DeleteButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if(res.ok) {
        router.push("/");
      } else {
        const errorData = await res.json();
        alert(`Error deleting recipe: ${errorData.error}`);
      }
    } catch {
      alert("Failed to delete recipe. Please try again");
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      >
        Delete Recipe
      </button>

      {/* modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* modal content */}
          <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-200 pointer-events-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Recipe
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &ldquo;{recipeTitle}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}