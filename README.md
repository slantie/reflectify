# Reflectify

Reflectify is an academic feedback workspace for managing academic records, importing faculty matrices, preparing feedback forms, inviting students, collecting responses, and analysing outcomes. It is a single Next.js application: the UI, protected workflows, public student experience, server actions, email delivery, and Neon/PostgreSQL data layer live in one codebase.

## Stack

- Next.js App Router, React, TypeScript, and Server Actions
- Prisma 7 with Neon/PostgreSQL
- Auth.js-compatible signed sessions and protected workspace routes
- shadcn/Base UI components, Phosphor Icons, and the Reflectify orange theme
- XLSX processing in Node.js — no Python processing service or Redis dependency
- Nodemailer SMTP for form invitations

## Quick start

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Create `.env` from the team-provided values. At minimum, configure `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `APP_URL`. Configure SMTP variables to send invitations.

3. Generate the Prisma client.

   ```bash
   pnpm prisma generate --schema prisma/schema.neon.prisma
   ```

4. Apply the approved database migration to the target Neon branch, then start development.

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000). The internal workspace requires an administrator session; student feedback routes are public and use the invitation token in the URL.

## Useful commands

```bash
pnpm dev                 # local development server
pnpm build               # production build
pnpm start               # run the production build
pnpm typecheck           # TypeScript validation
pnpm lint                # ESLint validation
pnpm prisma generate --schema prisma/schema.neon.prisma
pnpm prisma studio --schema prisma/schema.neon.prisma
```

## Key workflows

- **Academic setup:** colleges, departments, academic years, semesters, divisions, subjects, faculty, and allocations.
- **Data import:** faculty matrix and student-data imports, with validation before records are committed.
- **Feedback management:** create a schedule, select divisions, edit questions, upload invited students, activate/deactivate forms, and send invitations.
- **Student feedback:** students open their secure public link, select an eligible batch where required, provide 1–10 ratings, and submit once.
- **Analytics:** filter and inspect response, completion, faculty, subject, batch, category, division, semester, and academic-year trends.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database design](docs/DATABASE.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Operations and deployment](docs/OPERATIONS.md)
- [Performance and query audit](docs/PERFORMANCE.md)
- [Legacy migration guide](docs/LEGACY-MIGRATION.md)

## Repository

The canonical repository is [github.com/slantie/reflectify](https://github.com/slantie/reflectify).
