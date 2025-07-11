-- db setup for recipehub
-- run into postgresql db

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  profileUrl VARCHAR(500),
  savedRecipes TEXT[]
  --createdate, updatedate
)