# Restaurant SaaS starter

This repository is a minimal monorepo starter for a multi-tenant restaurant SaaS based on the architecture discussed in the design brief.

## Stack

- Backend: NestJS + TypeScript
- Frontend: React + Vite + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Monorepo: npm workspaces

## Structure

- `apps/api`: NestJS API and Prisma schema
- `apps/web`: React frontend shell

## Quick start

1. Install dependencies:
   npm install
2. Prepare environment:
   copy `apps/api/.env.example` to `apps/api/.env`
3. Run the app:
   npm run dev

## Database and production checks

Start PostgreSQL locally with Docker Desktop. The compose database uses host port `55432` so it does not conflict with an installed PostgreSQL service on port `5432`:

   docker compose up -d db

Apply the Prisma migration and seed data:

   npm run prisma:migrate --workspace apps/api
   npm run seed --workspace apps/api

Before production, set a strong `JWT_SECRET`, a restricted `CORS_ORIGIN`, and
`NODE_ENV=production` in `apps/api/.env`. The API health check is available at
`GET /health`.

## Production container deployment

Copy `.env.production.example` to `.env.prod` at the repository root and replace
all placeholder secrets and the public origin. The file is ignored by git and
is loaded automatically by `docker-compose.prod.yml`. Then build and start the
production stack:

   docker compose -f docker-compose.prod.yml up -d --build

The web container serves the application on `WEB_PORT` and proxies `/api` and
`/health` to the API. The API waits for a healthy PostgreSQL container and runs
`prisma migrate deploy` before starting. Seed data is intentionally not run in
production; create the first tenant through the registration flow or run the
seed command only in a controlled environment.

Check the deployment with:

   curl http://localhost:8080/health

## Notes

This starter focuses on the SaaS architecture foundation: tenant isolation, auth, branch handling, and starter API contracts. It is intentionally small and production-ready enough to be extended.
