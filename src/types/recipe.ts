export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  createdAt: Date;
  //updatedAt
  authorId: string;
  averageRating?: number; //new recipes start with no rating
  ratingCount?: number;
}