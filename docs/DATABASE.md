# Database design

Reflectify uses PostgreSQL on Neon through Prisma. The source of truth is [`prisma/schema.neon.prisma`](../prisma/schema.neon.prisma). Do not hand-edit the database schema in Neon without creating a reviewed migration.

## Domain model

| Domain                | Main models                                                                    | Notes                                                                              |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Identity              | `Admin`, `OTP`                                                                 | Administrator access and time-bound OTP records.                                   |
| Academic structure    | `College`, `Department`, `AcademicYear`, `Semester`, `Division`                | The hierarchy that scopes records and reporting.                                   |
| Teaching              | `Subject`, `Faculty`, `SubjectAllocation`                                      | Allocation uniquely identifies who teaches what, where, when, and for which batch. |
| Students              | `Student`, `PromotionHistory`                                                  | Student records belong to the academic context and division.                       |
| Forms                 | `FeedbackForm`, `FeedbackFormOverride`, `FormAccess`, `OverrideStudent`        | Form lifecycle and its invited-student audience.                                   |
| Questions and answers | `QuestionCategory`, `FeedbackQuestion`, `FeedbackSubmission`, `FeedbackAnswer` | Questions are ordered per form and answers use numeric ratings.                    |
| Reporting             | `FeedbackSnapshot`, `FeedbackAnalytics`, `AnalyticsView`, `CustomReport`       | Snapshots preserve historical reporting context.                                   |
| Operations            | `DivisionTimetable`                                                            | Timetable data used by the schedule workflow.                                      |

## Integrity rules

- A department name and abbreviation are unique within a college.
- A semester is unique for its department, academic year, number, and type.
- A subject code and abbreviation are unique within its semester.
- A subject allocation is unique by faculty, subject, division, semester, lecture type, batch, and academic year.
- A student or override student may receive one `FormAccess` record per form.
- A form’s question display order is unique within that form.
- A submission may answer a question only once.

These are database constraints, not merely UI validation.

## Indexing strategy

The schema indexes the highest-frequency filtering paths, including:

- academic-context student lookups;
- allocation lookups by academic year, faculty, and subject;
- active feedback-form and activation lookups;
- access completion lookups by form and submission status;
- question and answer lookups by form/question;
- reporting snapshots by academic context, faculty, subject, division, form/question, and submission time.

The snapshot indexes are deliberately redundant-looking because analytics filters start from different dimensions. They are preferable to a broad unindexed reporting scan.

## Connection configuration

- `DATABASE_URL` should use Neon’s pooled connection string for normal application traffic.
- `DIRECT_URL` should use the direct connection string for migrations and Prisma administrative work.
- Keep TLS enabled in production. Do not solve certificate issues by weakening production SSL verification.

## Schema change workflow

1. Update `prisma/schema.neon.prisma`.
2. Generate and review a migration against a non-production branch/database.
3. Run `pnpm prisma generate --schema prisma/schema.neon.prisma`.
4. Validate import, form creation, submission, and analytics on realistic data.
5. Apply the approved migration during a release window and retain a backup/rollback plan.

For a query change that needs a new index, capture `EXPLAIN (ANALYZE, BUFFERS)` first. Indexes speed reads but add storage and write cost.
