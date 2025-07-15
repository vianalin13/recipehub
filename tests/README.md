# Playwright E2E Tests

This directory contains end-to-end tests for the application using Playwright.

### Configuration

The Playwright configuration (`playwright.config.ts`) includes:
- Automatic dev server startup
- Multiple browser testing (Chrome, Firefox, Safari)
- Base URL configuration
- Retry logic for CI environments

## Test Files

- `register.spec.ts` - End-to-end tests for registration functionality
  - **Registration Form Display** - Verifies all form elements are visible
  - **Successful Registration** - Tests successful registration with valid username/email/password
  - **Error Handling** - Tests error handling for various scenarios:
    - Duplicate username (already exists)
    - Duplicate email (already exists)
    - Invalid email format
    - Empty username
    - Empty email
    - Empty password
  - **Loading States** - Verifies form shows loading state during registration
  - **Form Validation** - Ensures form is disabled during submission
  - **Error Recovery** - Tests that error messages clear when user tries again with valid data
  - Uses dynamic test data: generates unique user info for each test, inserts users for duplicate checks, and cleans up test users after all tests

- `login.spec.ts` - End-to-end tests for login functionality
  - **Login Form Display** - Verifies all form elements are visible 
  - **Successful Login** - Tests successful login scenarios: username/password and email/password
  - **Error Handling** - Tests error handling for invalid credentials:
    - Wrong password
    - Nonexistent user
    - Empty username
    - Empty password
  - **Loading States** - Verifies form shows loading state during login 
  - **Form Validation** - Ensures form is disabled during submission
  - Uses dynamic test data: creates a test user in the database before all tests and cleans up after all tests

## Running Tests

### Prerequisites

1. Make sure your database is running and accessible via `POSTGRES_URL` environment variable
2. Ensure your Next.js development server can be started with `npm run dev`

### Commands

```bash
#run all Playwright tests
npm run test:e2e

#run tests with UI mode (interactive)
npm run test:e2e:ui

#run tests in headed mode (see browser)
npm run test:e2e:headed

#run specific test file
npx playwright test login.spec.ts

#run tests in specific browser
npx playwright test --project=chromium
```

### Debugging

To debug tests:
1. Use `npm run test:e2e:ui` for interactive debugging
2. Use `npm run test:e2e:headed` to see the browser in action
3. Add `await page.pause()` in your test code to pause execution
4. Check the `test-results` directory for screenshots and traces 