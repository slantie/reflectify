# Legacy migration guide

## Goal

Move the historical feedback database into the normalized Neon schema without losing relationships, feedback history, or the ability to trace imported rows back to their academic context.

## Import utility

The migration utility lives in `scripts/import-legacy-database.ts`. It translates legacy Prisma-shaped records into the current schema. Read the script before running it; it is an operational procedure, not a routine development command.

## Recommended sequence

1. Create a backup of the legacy database and restore it to a non-production source for rehearsal.
2. Create a separate Neon branch or staging database for the import.
3. Apply the current Reflectify Prisma migrations.
4. Set the source and target connection variables required by the import script.
5. Run a dry/rehearsal import against a copy, capturing row counts and warnings.
6. Verify all high-value relationships: academic hierarchy, allocations, students, forms, access records, questions, submissions, and snapshots.
7. Compare representative analytics totals between legacy and the new database.
8. Repeat the import on the production target only after approval and retain the legacy backup.

## Validation checks

| Data set           | Verify                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Academic structure | Counts and parent relationships for colleges, departments, years, semesters, and divisions. |
| Teaching           | Allocation uniqueness and faculty/subject/division references.                              |
| Students           | Enrollment identifiers, batches, contact data, and division assignment.                     |
| Forms              | Status, dates, questions, invited students, and activation history where available.         |
| Feedback history   | Submission and snapshot counts, ratings, and reporting dimensions.                          |
| Analytics          | Response/completion counts and representative subject/faculty averages.                     |

## Safety rules

- Never point an untested import at the only production database.
- Do not delete legacy records after import; keep the verified backup until the cutover is accepted.
- Stop on referential-integrity errors instead of inventing missing parent records silently.
- Record every mapping exception so it can be reviewed and replayed.
- Prefer an explicit reconciliation report over assuming matching total table counts prove a successful migration.
