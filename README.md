# College System Backend

This repository contains the backend for the College System API built with Node.js (ES modules), Express and Prisma (PostgreSQL).

This README is focused on the current codebase and explains how contributors can get started quickly.

## Project layout

-   `src/`
    -   `server.js` — app entrypoint
    -   `config/connection.js` — Prisma client and DB connection
    -   `controllers/` — request handlers (authController, usersController, ...)
    -   `middlewares/` — JWT auth middleware
    -   `routes/` — express routers (authRoutes, usersRoutes, ...)
-   `prisma/` — Prisma schema and seed script
-   `README.md` — this file

## Quick setup (local development)

1. Install dependencies

```bash
git clone <repo-url>
cd college-system-backend
npm install
```

2. Environment variables

Create a `.env` file at the project root with at least:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/yourdb?schema=public"
JWT_SECRET="a_strong_secret"
PORT=3000
```

3. Prisma

If you modify `prisma/schema.prisma` or on first setup run:

```bash
npx prisma migrate dev --name init
npx prisma.generate
```

## Seeding the database (development only)

The project includes a seed script at `prisma/seed.js`. Important:

-   The seeder can be destructive — it performs `deleteMany()` on several tables. Run it only on a development database.
-   Ensure your Prisma schema matches the seed script's expected models before running.

Run seeder:

```bash
npm run seed
```

Default seeded users

-   Common password for seeded users: `Passw0rd!` (please change in real setups)

## Key endpoints (where to look in the code)

-   POST `/api/v1/auth/login` — Login (`src/controllers/authController.js`)
-   GET `/api/v1/users` — List users (`src/controllers/usersController.js`)
-   POST `/api/v1/users` — Create user (`src/controllers/usersController.js`)

## Authentication & middleware

-   JWT authentication lives in `src/middlewares/authMiddleware.js`. Login issues a token and the middleware validates it and sets `req.user`.

## Contributing

-   Fork or branch from `main` and open PRs with clear descriptions.
-   Add tests for critical behavior (middleware, controllers).
-   If you modify Prisma schema, include migrations and run `npx prisma generate`.

## Useful commands

-   Start dev server (watch):

```bash
npm run dev
```

-   Run seed (DESTRUCTIVE):

```bash
npm run seed
```

-   Prisma migrate & generate:

```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate
```
