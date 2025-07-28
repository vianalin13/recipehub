export interface RecipeData {
  title: string;
  imageUrl?: string;
  ingredients: string[];
  steps: string[];
}

export function validateRecipeData(data: unknown): { isValid: boolean; error?: string; validatedData?: RecipeData } {
  
  //type guard to check if data is an object
  if(!data || typeof data !== "object") {
    return {isValid: false, error: "Invalid data format"};
  }

  //type guard to check if data has the required properties
  if(!('title' in data) || !('ingredients' in data) || !('steps' in data)) {
    return {isValid: false, error: "Missing required fields"};
  }

  const {title, imageUrl, ingredients, steps } =  data as {
    title: unknown;
    imageUrl?: unknown;
    ingredients: unknown;
    steps: unknown;
  };

  //check for required fields
  if(title === null || title === undefined || !ingredients || !steps) {
    return { isValid: false, error: "Missing required fields"};
  }

  //validate required fields type
  if(typeof title !== "string" || !Array.isArray(ingredients) || !Array.isArray(steps)) {
    return { isValid: false, error: "Invalid data format"};
  }

  //validate imageurl if provided
  if(imageUrl !== null && imageUrl !== undefined && typeof imageUrl !== "string") {
    return { isValid: false, error: "Invalid data format"};
  }

  //check for empty title after type validation
  if(title.trim().length === 0) {
    return { isValid: false, error: "Title is required"};
  }

  const validIngredients = ingredients.filter(ingredient => ingredient.trim());
  const validSteps = steps.filter(step => step.trim());

  if(validIngredients.length === 0) {
    return { isValid: false, error: "At least one ingredient required"};
  }

  if(validSteps.length === 0) {
    return { isValid: false, error: "At least one step required"};
  }

  return {
    isValid: true,
    validatedData: {
      title: title.trim(),
      imageUrl: imageUrl?.trim() || undefined,
      ingredients: validIngredients,
      steps: validSteps
    }
  };
}
