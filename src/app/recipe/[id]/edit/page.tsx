"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { use } from "react";

type formField = "title" | "imageUrl";
type arrayField = "ingredients" | "steps";

export default function EditRecipePage({ params }: { params: Promise<{id: string}> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = use(params);
  const [formData, setFormData] = useState<{
    title: string;
    imageUrl: string;
    ingredients: string[];
    steps: string[];
  }>({
    title: "",
    imageUrl: "",
    ingredients: [""],
    steps: [""]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  //load existing recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${id}`);
        const data = await response.json();

        if(!response.ok) {
          setError(data.error || "Failed to load recipe");
          return;
        }

        const recipe = data.recipe;
        setFormData({
          title: recipe.title || "",
          imageUrl: recipe.image_url || "",
          ingredients: recipe.ingredients && recipe.ingredients.length > 0
            ? recipe.ingredients
            : [""],
          steps: recipe.steps && recipe.steps.length > 0
            ? recipe.steps
            : [""]
        });
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setError("Failed to load recipe");
      } finally {
        setInitialLoading(false);
      }
    };

    if(id) {
      fetchRecipe();
    }
  }, [id]);

  //handlers
  const handleInputChange = (field: formField, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleArrayChange = (field: arrayField, idx: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === idx ? value : item))
    }));
  };

  const handleAddArrayItem = (field: arrayField, idx: number | null = null) => {
    setFormData(prev => {
      const arr = prev[field];
      const newArr = 
        idx === null
          ? [...arr, ""]
          : [...arr.slice(0, idx+1), "", ...arr.slice(idx+1)];
      return {...prev, [field]: newArr};
    });
  };

  const handleRemoveArrayItem = (field: arrayField, index: number) => {
    setFormData(prev => {
      if(prev[field].length <= 1) {
        return prev;
      }
      return {
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if(!response.ok) {
        setError(data.error || "Failed to update recipe");
        return;
      }

      router.push(`/recipe/${id}`);

    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const renderArrayList = (
    field: arrayField,
    label: string,
    placeholder: string
  ) => (
    <div>
      <label className="block font-semibold">{label}</label>
      {formData[field].map((item, idx) => (
        <div key={idx} className="flex gap-2 group items-center">
          <input
            type="text"
            className="flex-1 border rounded"
            value={item}
            onChange={e => handleArrayChange(field, idx, e.target.value)}
            disabled={loading}
            placeholder={placeholder + " " + (idx+1)}
          />

          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
            onClick={() => handleAddArrayItem(field, idx)}
            tabIndex={-1}
            aria-label="Add after"
            disabled={loading}
          > 
            +
          </button>

          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
            onClick={() => handleRemoveArrayItem(field, idx)}
            tabIndex={-1}
            aria-label="Remove"
          > 
            -
          </button>
        </div>
      ))}
      <button
        type="button"
        className="bg-blue-100 rounded hover:bg-blue-200 text-blue-700 font-semibold"
        onClick={() => handleAddArrayItem(field, null)}
        disabled={loading}
      >
        + Add {placeholder}
      </button>
    </div>
  );

  //loading states
  if (status === "loading" || initialLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if (error && !formData.title) {
    return (
      <div className="p-8">
        <div className="bg-red-100 text-red-700 rounded p-4 mb-4">{error}</div>
        <button 
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Recipe</h2>
        {error && <div className="bg-red-100 text-red-700 rounded p-4 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block font-semibold mb-2">Title</label>
            <input
              id="title"
              type="text"
              className="w-full border rounded p-2"
              value={formData.title}
              onChange={e => handleInputChange("title", e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block font-semibold mb-2">Image URL (optional)</label>
            <input
              id="imageUrl"
              type="text"
              className="w-full border rounded p-2"
              value={formData.imageUrl}
              onChange={e => handleInputChange("imageUrl", e.target.value)}
              disabled={loading}
            />
          </div>

          {renderArrayList("ingredients", "Ingredients", "Ingredient")}
          {renderArrayList("steps", "Steps", "Step")}

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Recipe"}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/recipe/${id}`)}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}