# StackWise AI Platform

StackWise AI is a full-stack TypeScript workspace that helps teams understand, optimise, and expand their software toolchains. The platform combines automated discovery pipelines, stack intelligence, budgeting, and project-planning features behind a single Express + React application.

## Features

- **Discovery Hub & Recommendations** – Normalised discovery data from GitHub, npm, PyPI, and Docker rendered with unified DTOs; includes trending, semantic search, alternatives, and stack compatibility helpers.
- **Stack Intelligence** – Redundancy analysis, missing-piece identification, compatibility checks, and rich recommendation context for every user tool.
- **Budgeting & Cost Impact** – Scenario modelling APIs (/api/budget/discovery-planning, /api/discovery/cost-impact) that estimate adoption costs and potential savings.
- **Project & Knowledge Modules** – Project planning, documentation, and AI assistance endpoints sharing the same storage and authentication layers.
- **Modern UI** – Vite-powered React client with Radix UI components, Tailwind styling, and React Query for data fetching.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Radix UI, React Query
- **Backend:** Express, TypeScript, Drizzle ORM (PostgreSQL via Neon), Passport.js sessions
- **Tooling:** tsx, esbuild, Vite SSR integration, Chart.js, Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database (Neon Serverless by default)

### Installation

`ash
npm install
`

Create a .env file at the project root (or export the variables below) with at least:

`ash
DATABASE_URL="postgres://<user>:<password>@<host>/<db>"
SESSION_SECRET="replace-with-random-session-secret"
GITHUB_API_KEY="optional-github-token"
GEMINI_API_KEY="optional-google-gemini-key"
`

> Additional secrets referenced in server/doc-seeder.ts (e.g., JWT_SECRET, REDIS_URL) are only required if you execute that seeding/ops script locally.

### Development

`ash
npm run dev
`

This boots the Express API (with live logging) and attaches the Vite dev server for the React client. The app listens on http://localhost:5000 by default.

### Production Build

`ash
npm run build
npm start
`

- 
pm run build bundles the client through Vite and the server via esbuild into dist/.
- 
pm start serves the bundled Express app.

### Helpful Scripts

- 
pm run check – Type-check the entire workspace with 	sc.
- 
pm run db:push – Push Drizzle ORM migrations to the configured database.

## Project Structure

`
client/           React application routes, pages, and UI components
server/           Express server, routes, discovery engine, storage, auth, and utilities
shared/           Shared Zod schemas and TypeScript types for both client and server
attached_assets/  Static assets and CSV imports (optional)
`

## Data Model Highlights

- discovered_tools + related tables drive the discovery experiences.
- Drizzle ORM models live under shared/schema.ts with Zod-powered request/response schemas.
- Database connectivity configured in server/db.ts via Neon serverless.

## Contributing

1. Fork and clone the repository.
2. Install dependencies with 
pm install.
3. Run 
pm run dev and ensure both API and client load.
4. Include tests or manual validation notes with any pull request.

## License

MIT License. See the repository metadata for details.
