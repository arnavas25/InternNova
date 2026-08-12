# InternNova

**InternNova** is a modern internship and student-management platform built to simplify the way students, mentors, and administrators manage internship programs, learning activities, tasks, certificates, and career-related services.

The platform combines a public-facing website with dedicated **Student** and **Staff/Admin dashboards**, providing a centralized system for managing the complete internship journey.

---

## 🚀 About the Project

InternNova is designed around a simple goal:

> **Make internship management easier for students, mentors, and organizations.**

Instead of managing applications, tasks, resources, progress, certificates, and communication across multiple platforms, InternNova brings these workflows together in one system.

The current platform includes internship management, student dashboards, administrative tools, certificate workflows, payment integration, and a Resume Builder.

---

## ✨ Key Features

### 🎓 Student Dashboard

Students get a dedicated dashboard where they can:

* View internship information
* Access assigned tasks
* Submit completed tasks
* Track task and internship progress
* Access learning resources
* View schedules
* Manage their profile
* Receive notifications
* View certificates
* Check leaderboard information
* Access the Resume Builder

### 👨‍💼 Staff & Admin Dashboard

The administrative dashboard provides tools for managing the internship ecosystem:

* Student management
* Staff and mentor management
* Task creation and management
* Learning resources
* Task evaluation
* Student progress
* Internship batches
* Premium applications
* Certificate management
* Certificate orders
* Announcements
* Newsletter subscribers
* Team management
* Administrative operations

### 💼 Internship Management

The platform supports the complete internship workflow, including:

* Internship applications
* Student enrollment
* Internship batches
* Premium internship applications
* Campus Ambassador applications
* Task assignment
* Task submission
* Task evaluation
* Progress tracking

### 📜 Certificate System

InternNova includes a dedicated certificate workflow for:

* Certificate records
* Certificate display
* Certificate verification
* Certificate orders
* Certificate payments

### 💳 Payment Integration

Razorpay is integrated for supported platform services, including:

* Course payments
* Certificate payments
* Premium services
* Resume Builder plans

Payment verification is handled through server-side APIs.

### 📄 Resume Builder

The platform also includes a Resume Builder designed to help students create and manage professional resumes.

Current functionality includes:

* Resume creation
* Resume editing
* Resume data storage
* AI-assisted resume generation
* ATS-related scoring
* Resume plans
* Secure resume access

---

## 🌐 Public Website

The public-facing InternNova website includes:

* Home
* About
* Internship Programs
* Batches
* Courses
* Projects
* Blog
* FAQs
* Campus Ambassador
* Hall of Fame
* Employer Portal
* Certificate Verification
* Newsletter
* Terms & Conditions
* Privacy Policy
* Refund Policy
* Cancellation Policy

---

## 🛠️ Technology Stack

| Category       | Technology                  |
| -------------- | --------------------------- |
| Frontend       | React                       |
| Build Tool     | Vite                        |
| Routing        | React Router                |
| Backend        | Vercel Serverless Functions |
| Database       | Supabase                    |
| Authentication | Supabase Auth               |
| Payments       | Razorpay                    |
| AI             | Google Gemini               |
| Email          | Nodemailer / EmailJS        |
| Testing        | Playwright                  |
| Linting        | Oxlint                      |
| Deployment     | Vercel                      |

---

## 📁 Project Structure

```text
InternNova/
│
├── api/                       # Vercel API route handlers
│
├── public/                    # Public images, logos and static assets
│
├── server-routes/             # Server-side application logic
│   ├── _admin/                # Admin operations
│   ├── payment/               # Payment services
│   └── resume/                # Resume services
│
├── src/
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Shared utilities and Supabase client
│   ├── pages/                 # Website, dashboard and admin pages
│   └── styles/                # Application styles
│
├── supabase_migrations/       # Database migrations
├── tests/                     # Playwright end-to-end tests
│
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
├── supabase_schema.sql
├── vercel.json
└── vite.config.js
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

* **Node.js 20+**
* **npm**
* A **Supabase** project
* A **Razorpay** account if payment functionality is required
* A **Vercel** account for deployment

### Installation

Clone the repository:

```bash
git clone https://github.com/arnavas25/InternNova.git
```

Navigate into the project:

```bash
cd InternNova
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file using `.env.example` as a reference.

Configure the required Supabase, Razorpay, email, and AI environment variables.

> **Never commit `.env.local` or any file containing private credentials.**

### Run Locally

Start the development server:

```bash
npm run dev
```

The application will be available at the local URL provided by Vite.

---

## 🏗️ Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## 🧪 Testing

InternNova uses **Playwright** for end-to-end testing.

Run the test suite with:

```bash
npm run test:e2e
```

Automated tests should use dedicated development or staging accounts rather than real production accounts.

---

## 🗄️ Database

InternNova uses **Supabase** for authentication and application data.

The main database schema is available in:

```text
supabase_schema.sql
```

Database migrations are stored in:

```text
supabase_migrations/
```

The current Resume Builder uses a secure resume access-token system. For an existing database, apply:

```text
supabase_migrations/20260812_add_resume_access_token.sql
```

before using the updated Resume Builder workflow.

---

## 🔐 Security

InternNova handles student information, staff operations, authentication, payments, certificates, and resume data.

The project follows several important security practices:

* Private credentials are stored through environment variables.
* Supabase service-role credentials are kept server-side.
* Payment verification is performed server-side.
* Resume access is protected using secure access tokens.
* Admin functionality is handled through server-side APIs.
* Automated tests are designed to use dedicated test accounts.
* Development/debug credentials are not stored in the repository.

### Never commit

```text
.env
.env.local
.env.production
```

or any file containing:

* Supabase service-role keys
* Razorpay secret keys
* Email passwords
* Gemini/API keys
* Other private credentials

---

## 🚀 Deployment

InternNova is configured for **Vercel** deployment.

Before deploying:

1. Configure production environment variables in Vercel.
2. Configure the Supabase production project.
3. Verify Supabase RLS policies.
4. Configure Razorpay production credentials.
5. Apply required database migrations.
6. Run a production build.
7. Test authentication, payments, dashboards, and protected APIs.

Build locally before deployment:

```bash
npm run build
```

---

## 📌 Current Project Status

InternNova is currently an actively developed internship and student-management platform.

The current system focuses on:

**Internship Management → Student Dashboard → Tasks & Resources → Staff/Admin Management → Certificates → Payments → Resume Builder**

The platform is being continuously improved as new requirements and features are introduced.

---

## 🤝 Contributing

This repository is currently maintained as the InternNova project.

If external contributions are enabled in the future, contribution guidelines will be added here.

---

## 📄 License

No open-source license has currently been selected for this project.

---

<div align="center">

### InternNova

**Internship • Training • Career**

Built with ❤️ for students and organizations.

</div>
