export interface Comment {
  id: string;
  userId: string;
  recipeId: string;
  text: string;
  ratingId?: string; //can link comments to ratings
  createdAt: Date;
}