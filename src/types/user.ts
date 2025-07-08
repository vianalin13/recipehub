export interface User {
  id: string;
  username: string;
  email: string;
  password: string; //hashed
  bio?: string; //optional bio and profile url
  profileUrl?: string;
  savedRecipes: string[]; //array of recipe ids
  //createdAt and updatedAt date
}