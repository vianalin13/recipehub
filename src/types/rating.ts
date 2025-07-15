export interface Rating {
  id: number; //easier to update/delete specific ratings
  userId: number;
  recipeId: number;
  rating: number; //1-5
  createdAt: Date;
  updatedAt: Date;
}
