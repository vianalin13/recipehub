export interface Recipe {
  id: number;
  authorId: number;
  title: string;
  imageUrl?: string;
  ingredients: string[];
  steps: string[];
  averageRating?: number; //new recipes start with no rating
  ratingCount?: number;
  createdAt: Date;
  updatedAt: Date;
}