export interface Comment {
  id: number;
  userId: number;
  recipeId: number;
  ratingId?: number; //can link comments to ratings
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}