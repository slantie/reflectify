# Architecture

## System boundary

Reflectify is intentionally a single Next.js application. The old split frontend, orchestrator API, Python workbook service, Redis queue, and local database are replaced by one deployment boundary:

```text
Browser
  ├─ Public pages and student feedback routes
  └─ Protected administrator workspace
             │
       Next.js App Router
  ├─ Server Components for reads
  ├─ Server Actions for mutations
  ├─ Node workbook parsing
  ├─ SMTP email delivery
  └─ Session/authentication checks
             │
        Prisma ORM
             │
       Neon PostgreSQL
```

This avoids duplicating authorization and domain rules across separate services while keeping database access on the server.

## Application areas

| Area             | Responsibility                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/`           | Routes, layouts, page composition, metadata, public routes, and server actions.                                  |
| `app/actions/`   | Mutation-oriented business workflows: academic data, imports, feedback management, and analytics invalidation.   |
| `components/`    | Shared workspace shell, public navigation, forms, tables, charts, and responsive UI.                             |
| `components/ui/` | Installed shadcn/Base UI primitives only.                                                                        |
| `lib/`           | Prisma client, authentication/session helpers, email delivery, parsing, validation, and shared domain utilities. |
| `prisma/`        | Neon Prisma schema, migrations, and data-migration utilities.                                                    |
| `public/`        | Logos, team images, reference templates, and public static assets.                                               |

## Security model

1. Workspace routes are protected at the server boundary through the central admin-session helper and `ProtectedWorkspace` layout.
2. Server actions repeat authorization; hiding a button is never treated as authorization.
3. Public feedback routes use a form-access token and only disclose the form and student allocation associated with that token.
4. Feedback submission uses an atomic guarded update so an access link cannot create more than one submission.
5. Soft deletion (`isDeleted`) preserves history and must be included in every domain query.

## Feedback lifecycle

```text
Academic records + allocations
          ↓
Create draft feedback forms
          ↓
Edit questions / upload invited students
          ↓
Activate form and send SMTP invitations
          ↓
Student opens public token link and submits ratings
          ↓
Answers are preserved as feedback snapshots
          ↓
Analytics aggregates snapshots and revalidates cache tags
```

`FeedbackSnapshot` is the reporting boundary. It stores the contextual faculty, subject, division, batch, category, question, and numeric rating needed to keep historical analytics stable if academic records later change.

## Caching

- Request-level session work is memoized with React `cache()`.
- Analytics filter dictionaries are cached for five minutes.
- Analytics summaries are cached for two minutes and invalidated with the `analytics` cache tag after relevant mutations.
- Write operations are always authoritative; cached values are a read optimization, not a source of truth.

See [Performance and query audit](PERFORMANCE.md) for the known limit of the current analytics aggregation path.
