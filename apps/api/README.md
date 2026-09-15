# API backend

## Database setup

1. Start PostgreSQL via Docker or local installation.
2. Update `.env` with correct `DATABASE_URL`.
3. Run:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

## Seed data

The seed script creates a sample tenant, branch, user, membership, category, product, and tables.

Login credentials:
- email: owner@pizzaabc.vn
- password: 123456
