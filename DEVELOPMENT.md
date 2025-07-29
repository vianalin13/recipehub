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
- **Reflection:** Coming from Express/Handlebars/MongoDB stack, this documentation helped me transition to React and understand modern web development concepts like static/dynamic rendering and SEO.

2025-07-01
- Set up database: Vercel and PostgreSQL
- Tested PostgreSQL by seeding and querying
- **Reflection:** Initially planned to use MongoDB, but switched to PostgreSQL after learning it's better for relational data like recipes, ratings, and comments.

2025-07-04
- Set up base folders and app routes
- **Reflection:** After just initializing base folders and testing PostgreSQL, I ran Eslint and encountered 4160 errors because I had not yet configured ".eslintignore" to exclude the ".next" build folder. This made me realize the importance of linting regularly especially early in the project helps prevent errors from piling up.

2025-07-06
- Configured ESLint with TypeScript and React best practices
- **Reflection:** Using TypeScript made me to think more carefully about data structures.

2025-07-08
- Created TypeScript interfaces for all data models (User, Recipe, Rating, Comment) (`src/types/user.ts`, `src/types/recipe.ts`, `src/types/rating.ts`, `src/types/comment.ts`)
- **Reflection:** Planning the data models early helped clarify relationships between entities

2025-07-10
- Implemented user registration with credentials (username, email, password) (`src/app/register/page.tsx`, `src/app/api/auth/register/route.ts`)
- Added password hashing with bcrypt for security
- Connected registration form to PostgreSQL via Neon and Vercel
- **Reflection:** Setting up the database table in Neon via the Vercel integration helped me understand the difference between TypeScript interfaces (for type safety in code) and the actual SQL table structures (for storing data).

2025-07-11
- Implemented user login with NextAuth credentials provider (`src/app/login/page.tsx`, `src/app/api/auth/[...nextauth]/authOptions.ts`, `src/app/api/auth/[...nextauth]/route.ts`)
- **Reflection:** Was initially confused about how the login process worked with NextAuth. I thought it would be more straightforward to manually import and call the authorize function from authentication but learned that NextAuth's built-in signIn function automatically handles the request, calls my custom authorize logic on the backend, and manages sessions securely behind the scenes.

2025-07-12
- Added Jest test for user registration API (`src/__tests__/register.test.ts`)
- Covered cases for successful registration, duplicates, missing fields, extra fields, database errors, and password hashing
- **Reflection:** While debugging tests, I learned that string interpolation of the error doesn't log the full error object message. I also learned that using Date.now() to generate unique usernames and emails for each test run prevents conflicts so that the database doesn't need to be cleared between each run.

2025-07-13
- Added Jest test for NextAuth authorization logic (`src/__tests__/auth.test.ts`)
- Added Playwright E2E tests for login functionality (`tests/login.spec.ts`)
- Added Playwright E2E tests for registration functionality (`tests/register.spec.ts`)
- **Reflection:** Using `beforeEach` instead of `beforeAll` for generating unique test data prevents database conflicts between tests and taught me the importance of test isolation. Also discovered that proper label-input associations (`htmlFor` attributes) are crucial for Playwright's `getByLabel` selectors to work correctly. The combination of Jest unit tests and Playwright E2E tests provides coverage of both backend functionality and frontend user flows.

2025-07-14
- Finalized database schemas for users, recipes, ratings, comments, and saved recipes join table (`database-setup.sql`, `src/types/saved-recipe.ts`)
- Updated all TypeScript interfaces in `src/types/` to match the new schema
- **Reflection:** Adding a join table for saved recipes is more scalable. Adding indexes for major foreign keys optimize query performance. 

2025-07-16
- Implemented backend and basic frontend for creating a new recipe (`src/app/api/recipes/route.ts`, `src/app/recipe/new/page.tsx`)
- **Reflection:** Ingredients and steps use the same features and format, so making a reusable function reduces duplication

2025-07-19
- Added Jest test for recipe creation API (`src/__tests__/create-recipe.test.ts`)
- Includes 17 test cases covering authentication, validation, data filtering, and database storage
- **Reflection:** Initially struggled with NextAuth session cookies in tests - they were redirecting (302) instead of creating sessions. Learned that NextAuth is designed for browser-based authentication, not API testing. Researched and found that it is standard to actually bypass authentication with test headers (`x-test-user-email`). This approach tests all business logic (validation, database storage, error handling) without complex session management. The key insight: don't fight the framework - create a "test mode" that bypasses complex authentication while testing all the important functionality.

2025-07-20
- Fixed Jest test issue with pool not closing (`src/__tests__/auth.test.ts`)
- **Reflection:** `authOptions` import already creates a database pool, so creating a new pool in tests would result in two separate pools that are running and one not being closed properly. In this case, it's best to reuse the existing pool instead of creating a new one. 

- Fixed Playwright test issues with database pool conflict (`tests/login.spec.ts`, `tests/register.spec.ts`)
- **Reflection:** 
  - When running multiple Playwright test files (`login.spec.ts` and `register.spec.ts`) together, both files were creating their own database pools and calling `pool.end()`. This caused "Cannot use a pool after calling end on the pool" errors because when tests run in parallel, one test file would finish and close its pool while the other was still trying to use it. Each test file should create their own isolated pool instead of sharing a global pool to ensure proper isolation between test suites.
  - Spent 5 hours debugging unexpected errors because I ran `npx playwright test` instead of `npm run test:e2e`. The npm script includes proper project configuration (environment variables, webServer setup, etc.) while `npx playwright test` runs the tests without these configurations, causing numerous errors. Always use project's npm scripts for testing to ensure proper setup and configuration

2025-07-21
- Finished backend and basic frontend for individual recipe page by id (`src/app/api/recipes/[id]/route.ts`, `src/app/recipe/[id]/page.tsx`) 
- **Reflection:** Next.js encourages the use of `<Image />` for image optimization, but it requires explicitly listing every allowed image domain in the config. For user-pasted or arbitrary image URLs, this is impractical, so using `<img>` is more flexible.

2025-07-22
- Added Jest and Playwright tests for recipe detail page by ID (`src/__tests__/recipe-id.test.ts`, `tests/recipe-id.spec.ts`)
- Improved registration API error handling with proper PostgreSQL duplicate key error detection (`src\app\api\auth\register\route.ts`)
- **Reflection:** Replaced `as any` with proper `PostgreSQLError` interface for type safety.Using `as any` disables type safety and can hide bugs, while using a proper interface lets TypeScript catch errors before they happen. 

2025-07-23
- Fixed test error in  `tests/register.spec.ts` by running tests in serial mode.
- **Reflection:** Running E2E tests in serial is not best practice for large-scale projects, but for now it ensures my tests are reliable and my features are covered. In the future, I plan to refactor for full parallel safety using per-test unique data and cleanup.

2025-07-25
- **Reflection:** Spent significant time working on Playwright E2E tests for recipe creation, but realized this was premature. E2E testing is more valuable when the UI is complete and stable. At this development stage, focusing on Jest unit tests provides better ROI and faster feedback cycles.

2025-07-26
- Implemented backend and basic frontend for recipe editing functionality 
  - API Route for PUT - (`src/app/api/recipes/[id]/route.ts`)
  - Server Component: Recipe detail page (`src/app/recipe/[id]/page.tsx`) with server-side authentication and author verification
  - Client Component: Edit button (`src/app/recipe/[id]/EditButton.tsx`) 
  - Edit Form: (`src/app/recipe/[id]/edit/page.tsx`)
- Refactored shared code between create and edit routes (`src/app/api/recipes/route.ts`, `src/app/api/recipes/[id]/route.ts`) - reduced code duplication by 60%
  - Created shared user authentication and recipe validation helper (`src/lib/auth-helpers.ts`, `src/lib/validation.ts`)
- **Reflection:** The create and edit forms share a significant amount of code. While backend optimization (shared validation, auth helpers) centralizes logic and makes it easier to maintain and test, frontend abstraction can reduce readability. Each page has specific needs, so keeping forms similar but separate maintains clarity over cleverness.

2025-01-27
- Optimized test user and username/email generation in Jests 
- **Reflection:** 

---

## Future Improvements

- **Refactor E2E tests in the `tests/` folder for parallel safety:**  
  Update all E2E tests to use UUIDs for unique test data and remove global cleanup. This will allow tests to run in parallel without risk of data collisions or race conditions, making the suite faster and more scalable for CI/CD.



---

## Feature Roadmap

Planned and completed features for Recipehub:

- [x] UI/UX Mockups
- [x] Project scaffolding (Next.js, TypeScript, Tailwind)
- [x] ESLint setup
- [x] PostgreSQL integration
- [x] User authentication (NextAuth.js)
- [x] Recipe CRUD (Create, Read, Update, Delete)
- [ ] Ratings & Comments
- [ ] Search & Filter
- [ ] Blog URL recipe extraction
- [ ] Responsive design & accessibility
- [ ] Deployment & CI/CD

---
