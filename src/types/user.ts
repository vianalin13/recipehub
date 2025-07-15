export interface User {
  id: number;
  username: string;
  email: string;
  password: string; //hashed
  bio?: string; //optional bio and profile url
  profileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
