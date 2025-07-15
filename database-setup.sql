-- db setup for recipehub
-- run into postgresql db

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  ingredients TEXT[] NOT NULL,
  steps TEXT[] NOT NULL,
  average_rating REAL,
  rating_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating_id INTEGER REFERENCES ratings(id) ON DELETE SET NULL, -- nullable
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saved_recipes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, recipe_id)
);

-- add indexes for performance optimization
CREATE INDEX recipes_author_id ON recipes(author_id);
CREATE INDEX ratings_user_id ON ratings(user_id);
CREATE INDEX ratings_recipe_id ON ratings(recipe_id);
CREATE INDEX comments_user_id ON comments(user_id);
CREATE INDEX comments_recipe_id ON comments(recipe_id);
CREATE INDEX comments_rating_id ON comments(rating_id);
CREATE INDEX saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX saved_recipes_recipe_id on saved_recipes(recipe_id);

