"use client";

import { useRouter } from "next/navigation"; //redirects after successful creation
import { useSession } from "next-auth/react"; //check if user can create recipes
import { useState } from "react"; //store form data as user types, tracking loading/error states

// CREATE TABLE recipes (
//   id SERIAL PRIMARY KEY,
//   author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   title VARCHAR(255) NOT NULL,
//   image_url VARCHAR(500),
//   ingredients TEXT[] NOT NULL,
//   steps TEXT[] NOT NULL,
//   average_rating REAL,
//   rating_count INTEGER,
//   created_at TIMESTAMP DEFAULT NOW(),
//   updated_at TIMESTAMP DEFAULT NOW()
// );

type formField = "title" | "imageUrl";
type arrayField = "ingredients" | "steps";

export default function CreateRecipePage() {

  //hooks
  const { data: session, status } = useSession();
  const router = useRouter(); 
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

  //handlers
  const handleInputChange = (field: formField, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleArrayChange = (field: arrayField, idx: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      //item is value at curr index, i is curr index
      //if i matches index we handling change at, change it to value, if not keep it as item
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
      if(prev[field].length <= 1) {return prev;}
      return {
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index) //_ all the values that don't matter, only i matters, cuz we wanna remove it
      };
    });
  };

  //handlesubmit
  const handleSubmit = async (e: React.FormEvent) => { //takes object e from form submission
    e.preventDefault(); //prevents default form submission behavior (reload the page)
    setLoading(true); 
    setError(""); //clear prev error messages
    try {
      const response = await fetch("/api/recipes", { //POST req to /api/recipes with form data as JSON
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData)
      });

      const data = await response.json(); //get the response and parse with json
      if(!response.ok) { //if response status is not 2xx/OK
        setError(data.error || "Failed to create recipe"); 
        return;
      }

      //if recipe fails to create at any point, it will fail and end the code early and stay on recipe page
      //check if id exists, after recipe has successfully been created
      router.push(data.recipe?.id ? `/recipe/${data.recipe.id}`: "/"); //if id not present, redirect to homepage

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
        className="bg-blue-100 rounded hover:bg-blue-200 text-blue-700 front-semibold"
        onClick={() => handleAddArrayItem(field, null)}
        disabled={loading}
      >
        + Add {placeholder}
      </button>
    </div>
  );

   //redirect if not logged in
   if(status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  if(!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Recipe</h2>
      {error && <div className="bg-red-100 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" className="bold font-semibold">Title</label>
          <input
            id="title"
            type="text"
            className="w-full border rounded"
            value={formData.title}
            onChange={e => handleInputChange("title", e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="bold font-semibold">Image URL (optional)</label>
          <input
            id="imageUrl"
            type="text"
            className="w-full border rounded"
            value={formData.imageUrl}
            onChange={e => handleInputChange("imageUrl", e.target.value)}
            disabled={loading}
          />
        </div>

        {renderArrayList("ingredients", "Ingredients", "Ingredient")}
        {renderArrayList("steps", "Steps", "Step")}

        <button
          type="submit"
          className="bg-blue-500 text-white"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Recipe"}
        </button>
      </form>
    </div>
  );
}