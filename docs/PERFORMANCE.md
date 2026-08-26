# Performance and query audit

## Current assessment

The normal operational queries are intentionally efficient, but the application is not yet universally “fully optimized.” The most important remaining performance work is cold analytics aggregation.

| Path                 | Current approach                                                     | Assessment                                               |
| -------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| Auth/session         | Verified session ID lookup, cached for 60 seconds                    | Good after warmup.                                       |
| Academic CRUD        | Scoped filters, selected fields, schema uniqueness/indexes           | Good for normal workspace scale.                         |
| Dashboard counts     | Independent reads run concurrently with `Promise.all`                | Good; can be cached if real traffic proves it necessary. |
| Feedback submission  | Guarded `updateMany` and answer/snapshot writes inside a transaction | Good for correctness and duplicate prevention.           |
| Analytics filters    | Five small independent lookups cached for five minutes               | Good.                                                    |
| Analytics cache hit  | Five-minute tagged summaries and form-completion result              | No routine Neon read.                                    |
| Analytics cache miss | One PostgreSQL `GROUPING SETS` query returns compact aggregate rows  | Optimized; remote database latency remains the limit.    |

## Analytics implementation

The analytics route now sends only compact aggregates to Next.js rather than transferring individual answer snapshots. PostgreSQL calculates `COUNT`, `COUNT(DISTINCT ...)`, `AVG`, response distribution, and the subject/faculty/batch/category/academic comparison groups with one parameterized `GROUPING SETS` query.

The report executes with transaction-local `work_mem` of 8 MB. This avoids an observed temporary-disk sort while preserving Neon’s global configuration for every other query.

Independent route data is cached with the `analytics` tag for five minutes and invalidated after feedback, form, allocation, or academic mutations. The protected-route admin lookup is also cached for 60 seconds from the verified session ID.

On the current 14,200-snapshot dataset, `EXPLAIN (ANALYZE)` measured database execution at about 218 ms for a completely uncached all-years report. A remote Neon round trip alone measured roughly 90–110 ms, so no implementation can honestly promise a consistent sub-100 ms **cold** response. A cache hit avoids the Neon query and is the normal path expected to meet the 100 ms interaction target.

## Next scaling step

For substantially larger reporting history or a hard cold-read SLO, introduce maintained rollup tables or materialized views keyed by academic year, department, semester, division, subject, faculty, batch, and category. Refresh them after a submission or in a durable database-backed job. Validate that decision with `EXPLAIN (ANALYZE, BUFFERS)` before adding indexes or a new write path.

## Existing database support

The schema already contains reporting-oriented indexes on `FeedbackSnapshot` by academic context, subject/year, faculty/year, division/year, form/question, and submission date. The form-access completion path is indexed by form and submission state. These are the foundation for scoped analytics reads and the next rollup pass.

## Performance targets

- **Interactive UI:** keep cache-hit workspace reads responsive; avoid loading unneeded relations or `include` trees.
- **Analytics cache hit:** application compute should be minimal; end-to-end time still includes browser, network, and Neon latency, so “sub-millisecond” cannot be a reliable user-visible promise.
- **Analytics cold read:** establish a measured p95 target after collecting production-sized data and query plans.
- **Writes:** preserve atomicity over micro-optimizations, especially for submissions, activation, and imports.

## Query review rules

- Always filter soft-deleted records.
- Select only needed scalar fields; do not fetch complete model graphs for lists/charts.
- Run independent queries concurrently only when they have no consistency dependency.
- Invalidate analytics caches after mutations that change submissions, forms, questions, students, or allocations.
- Measure with real data and `EXPLAIN` before calling a query optimized.
