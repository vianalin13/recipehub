# Recipehub - Development Log

This log tracks the progress, major milestones, decisions, and planned features for Recipehub — a full-stack recipe sharing platform built with Next.js, PostgreSQL, and Tailwind CSS.

---

## Development Log

2025-06-23
- Wrote README
- Created UI mockup images

2025-06-24
- Created sitemap, data models, logo
- Optimized fonts and images

2025-06-25 to 2025-07-05
- [Studied React and Next.js documentation](https://nextjs.org/learn)
- Reviewed JavaScript fundamentals (ES6+ features, async/await, promises, destructuring)
- Refreshed HTML semantics and accessibility best practices
- **Reflection:** Coming from Express/Handlebars/MongoDB stack, this documentation helped me transition to React and understand modern web development concepts like static/dynamic rendering and SEO

2025-07-01
- Set up database: Vercel and PostgreSQL
- Tested PostgreSQL by seeding and querying
- **Reflection:** Initially planned to use MongoDB, but switched to PostgreSQL after learning it's better for relational data like recipes, ratings, and comments.

2025-07-04
- Set up base folders and app routes

2025-07-06
- Configured ESLint with TypeScript and React best practices
- **Reflection:** Setting up linting early prevents bad habits and ensures consistent code quality. TypeScript strict mode caught several potential bugs.

2025-07-08
- Created TypeScript interfaces for all data models (User, Recipe, Rating, Comment)
- **Reflection:** Planning the data models early helped clarify relationships between entities

2025-07-10
- Implemented user registration with credentials (username, email, password)
- Added password hashing with bcrypt for security
- Connected registration form to PostgreSQL via Neon and Vercel
- **Reflection** Setting up the database table in Neon via the Vercel integration helped me understand the difference between Typescript interfaces (for type safety in code) and the actual SQL table structures (for storing data).

---


## Feature Roadmap

Planned and completed features for Recipehub:

- [x] UI/UX Mockups
- [x] Project scaffolding (Next.js, TypeScript, Tailwind)
- [x] ESLint setup
- [x] PostgreSQL integration
- [ ] User authentication (NextAuth.js)
- [ ] Recipe CRUD (Create, Read, Update, Delete)
- [ ] Ratings & Comments
- [ ] Search & Filter
- [ ] Blog URL recipe extraction
- [ ] Responsive design & accessibility
- [ ] Deployment & CI/CD
