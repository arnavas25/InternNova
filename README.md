# InternNova

InternNova is an internship and student-management platform designed to manage internship programs, student activities, tasks, resources, certificates, applications, payments, and staff operations from a centralized platform.

The current project includes a public website, student dashboard, staff/admin dashboard, internship management system, certificate workflows, payment integration, and a Resume Builder.

## Features

* **Public Website** — Company information, internship programs, batches, courses, projects, blogs, FAQs, Campus Ambassador program, Hall of Fame, Employer Portal, certificate verification, and legal pages.
* **Student Dashboard** — Internship overview, assigned tasks, task submission, progress tracking, learning resources, schedules, notifications, profile management, certificates, leaderboard, and Resume Builder.
* **Staff/Admin Dashboard** — Student and staff management, tasks, resources, task evaluation, premium applications, certificates, newsletter management, announcements, teams, and other administrative operations.
* **Internship Management** — Internship applications, student enrollment, batches, premium applications, Campus Ambassador applications, task assignment, submissions, evaluations, and progress tracking.
* **Certificate System** — Certificate management, verification, certificate orders, and payment workflows.
* **Payment Integration** — Razorpay integration for supported course, certificate, premium, and Resume Builder payments.
* **Resume Builder** — Resume creation and editing, resume data storage, AI-assisted generation, ATS-related scoring, paid plans, and secure resume access.

## Tech Stack

**Frontend:** React, Vite, React Router
**Backend:** Vercel Serverless Functions
**Database & Authentication:** Supabase
**Payments:** Razorpay
**AI:** Google Gemini
**Email:** Nodemailer, EmailJS
**Testing:** Playwright
**Linting:** Oxlint
**Deployment:** Vercel

## Project Structure

```text
InternNova/
├── api/                    # Vercel API routes
├── public/                 # Public assets
├── server-routes/          # Server-side application logic
│   ├── _admin/             # Admin operations
│   ├── payment/            # Payment APIs
│   └── resume/             # Resume APIs
├── src/
│   ├── components/         # Reusable UI components
│   ├── lib/                # Shared utilities and Supabase
│   ├── pages/              # Website, dashboard and admin pages
│   └── styles/             # Global styles
├── supabase_migrations/    # Database migrations
├── tests/                  # Playwright tests
├── .env.example
├── package.json
├── supabase_schema.sql
├── vercel.json
└── vite.config.js
```

## Getting Started

### Requirements

* Node.js 20+
* npm
* Supabase project
* Razorpay account for payment features
* Vercel account for deployment

### Installation

```bash
git clone https://github.com/arnavas25/InternNova.git
cd InternNova
npm install
```

Create a `.env.local` file using `.env.example` and add the required environment variables.

Start the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## Environment Variables

Environment variables are documented in `.env.example`.

Private credentials such as Supabase service-role keys, Razorpay secret keys, email passwords, and AI API keys must never be committed to the repository.

## Supabase

Supabase is used for authentication and application data.

The database schema is available in `supabase_schema.sql`, while migrations are stored in `supabase_migrations/`.

For an existing database, apply:

```text
supabase_migrations/20260812_add_resume_access_token.sql
```

before using the current Resume Builder workflow.

## Deployment

The project is configured for Vercel. Configure the required environment variables in the Vercel project settings and deploy the repository.

## Security

InternNova handles student data, staff operations, authentication, payments, certificates, and resume information.

The repository is configured to keep private credentials outside the source code and uses server-side payment verification and protected resume access.

For production deployments:

* Never commit `.env` or `.env.local`.
* Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
* Keep payment secrets server-side.
* Protect admin APIs with authentication and authorization.
* Use dedicated accounts for automated testing.
* Keep staging and production environments separate.
* Configure Supabase Row Level Security (RLS) correctly.

## Current Status

InternNova is an actively developed platform focused on internship management, student dashboards, staff operations, certificates, payments, and career-related tools.

The project will continue to evolve as new features and improvements are added.

---

**InternNova — Internship, Training & Career Platform**
