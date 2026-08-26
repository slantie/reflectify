# Operations and deployment

## Production readiness

- Configure production `APP_URL` before activating forms. Invitation links and metadata use it.
- Use Neon’s pooled URL for `DATABASE_URL` and its direct URL for `DIRECT_URL`.
- Use a new high-entropy `AUTH_SECRET` for every environment.
- Verify the SMTP sender domain, SPF/DKIM/DMARC policy, and sender address before sending a real cohort.
- Build and test the app with the production environment configuration before release.

## Standalone deployment package

`pnpm build` produces `.next/standalone`, a minimal Node.js runtime containing
only the traced production files. The release archive also contains its required
`public` and `.next/static` assets, which Next.js does not copy into the
standalone directory automatically.

Extract the archive, add a production `.env` based on `.env.example`, then run:

```bash
PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

The archive deliberately excludes `.env` and therefore contains no database,
SMTP, or authentication secrets.

## Invitation delivery

Form activation sends SMTP invitations directly from the Next.js server. The email is branded with the local Reflectify logo as an embedded CID attachment, so it does not depend on a public image host.

Large sends require an operational decision. A serverless request can time out or be rate-limited if it sends thousands of messages synchronously. For larger cohorts, use a durable database-backed delivery job/outbox rather than reintroducing Redis:

1. Write one pending email row per recipient in the same transaction as activation.
2. Have a scheduled, authenticated worker route claim a bounded batch using row locks.
3. Send, record message metadata, retry transient failures with exponential backoff, and expose failed sends to administrators.

This is the recommended replacement for the legacy Redis queue because jobs survive a Next.js instance restart and remain observable in PostgreSQL.

## Monitoring

Track at least:

- failed Server Actions and authorization failures;
- SMTP accepted/rejected/error counts;
- form activation and student submission rates;
- cold analytics response time and cache-hit ratio;
- Neon connection, CPU, storage, and slow-query indicators.

Avoid logging access tokens, password material, complete student data, or raw database URLs.

## Backup and recovery

- Keep Neon’s point-in-time recovery/backup policy enabled for the production branch.
- Take a logical export before large legacy imports or destructive migrations.
- Rehearse restoring the export to a separate Neon branch; a backup that has not been restored is unverified.
- Soft deletion is not a substitute for backups.

## Release checklist

1. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
2. Apply the reviewed migration to the intended Neon branch.
3. Confirm administrator login, a protected action, and a public feedback link.
4. Send a test invitation to a controlled mailbox.
5. Verify analytics after a test submission.
6. Watch error and mail-delivery signals immediately after release.
