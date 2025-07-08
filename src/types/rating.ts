export interface Rating {
  id: string; //easier to update/delete specific ratings
  userId: string;
  recipeId: string;
  rating: number; //1-5
  createdAt: Date;
}