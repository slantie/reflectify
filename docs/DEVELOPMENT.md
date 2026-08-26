# Development guide

## Local environment

Use Node.js and pnpm versions supported by the project lockfile. Never commit `.env` files or production connection strings.

Required configuration is supplied by the project owner:

| Variable       | Purpose                                                               |
| -------------- | --------------------------------------------------------------------- |
| `DATABASE_URL` | Neon pooled PostgreSQL connection for application reads/writes.       |
| `DIRECT_URL`   | Direct Neon connection for Prisma migration tooling.                  |
| `AUTH_SECRET`  | High-entropy secret for signed administrator sessions.                |
| `APP_URL`      | Canonical public base URL; used in metadata and invitation links.     |
| SMTP variables | SMTP host, port, user, password, sender name/address for invitations. |

## Daily workflow

```bash
pnpm install
pnpm prisma generate --schema prisma/schema.neon.prisma
pnpm dev
```

Before opening a pull request or handing off a change:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Server and client boundaries

- Prefer Server Components for database-backed page reads.
- Use Server Actions for authenticated mutations and validate all form input on the server.
- Keep the Prisma client and SMTP code server-only.
- Add `"use client"` only for interaction, browser APIs, or client state.
- Do not pass raw IDs to users as display labels; resolve meaningful academic names in selectors and tables.

## UI conventions

- Use existing shadcn/Base UI primitives from `components/ui`; do not introduce ad-hoc native controls.
- Use the shared dashboard shell and page-header spacing. New protected pages should look like part of the same workspace.
- Chart colours must use `var(--chart-*)`, never hard-coded series colours. This supports light/dark mode and future theme changes.
- Design both a narrow mobile layout and a desktop layout. Avoid desktop-only dense tables without a responsive fallback.
- Use React Hot Toast for mutation feedback, including failures.

## Testing checklist

For changes touching feedback forms, test these paths manually:

1. Create a draft form from an eligible allocation.
2. Add, edit, reorder, and delete questions.
3. Upload student data with valid and invalid worksheets.
4. Activate and deactivate a form.
5. Open a student invitation link on desktop and mobile.
6. Submit required 1–10 ratings once and verify the thank-you route.
7. Confirm the updated answer is represented in analytics after cache invalidation.

## Database changes

Follow the schema-change workflow in [Database design](DATABASE.md). A migration must be reviewed separately from an application-only change. Do not use `db push` against the production database as a replacement for a migration.
