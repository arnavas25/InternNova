# InternNova

InternNova is a React/Vite internship and career platform with student, staff/admin, internship, certificate, payment, and resume-builder workflows.

## Tech Stack

- React 19
- Vite
- React Router
- Supabase
- Vercel Serverless Functions
- Razorpay
- Google Gemini
- Nodemailer
- Playwright

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure the required environment variables before using Supabase, payments, email, or AI features.

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## E2E Tests

E2E tests intentionally **do not contain real credentials** and default to a local development URL.

Set dedicated staging/test credentials before running:

```bash
TEST_BASE_URL=
TEST_STAFF_ID=
TEST_STAFF_PASS=
TEST_STUDENT_EMAIL=
TEST_STUDENT_PASS=
```

Never use production user credentials for automated tests.

## Security

- Never commit `.env` files or secrets.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Server-side Supabase access requires `SUPABASE_SERVICE_ROLE_KEY`.
- Razorpay payment verification is always signature-checked; there is no production test bypass.
- Resume records use a private access token in addition to the public resume ID.
- Admin credential export of plaintext passwords has been removed.
- Debug/database scripts containing production credentials have been removed.
- Use dedicated staging/test accounts for Playwright.
- Configure Supabase RLS for browser-side database access.

## Resume Access Token Migration

For an existing production database, run:

```text
supabase_migrations/20260812_add_resume_access_token.sql
```

New resume purchases automatically receive a cryptographically random access token. The token is stored only in the user's browser and is required for resume read/write/AI-generation API calls.

## Project Structure

```text
api/                 Vercel API route adapters
server-routes/       Server-side business logic
src/components/      Shared UI components
src/pages/           Application pages
src/lib/             Shared frontend utilities
public/              Static assets
tests/               Playwright E2E tests
supabase_schema.sql  Database schema
supabase_migrations/ Database migrations
```

## Production Checklist

- [ ] Configure all production environment variables in Vercel.
- [ ] Run the resume access-token migration on an existing database.
- [ ] Verify Supabase RLS policies.
- [ ] Use Razorpay production credentials only in server environment variables.
- [ ] Use dedicated staging credentials for E2E tests.
- [ ] Confirm no secrets are present in Git history.
- [ ] Run `npm run build` and `npm run lint`.
