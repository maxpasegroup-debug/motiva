# Motiva Edus Production Stabilization Safety Report

Branch: `production-stabilization`
Date: 2026-05-01

This report records the pre-change safety baseline. No application logic has been modified as part of this report.

## 1. Current Build, Lint, And Prisma Status

- `npm run lint`: PASS
  - `next lint` completed with no ESLint warnings or errors.
- `npx prisma validate`: PASS
  - Prisma schema loaded from `prisma/schema.prisma`.
  - Schema is valid.
  - Prisma reported an available major update from `6.19.3` to `7.8.0`; no upgrade was performed.
- `npm run build`: PASS
  - Next.js `14.2.35` production build completed successfully.
  - Type checking completed successfully.
  - Static generation completed for `74` pages.
  - Middleware bundle was generated.

## 2. Critical Files

### Auth

- `src/app/api/auth/internal/login/route.ts`
  - Internal PIN login for admin, mentor, teacher, telecounselor, demo executive, parent, and student accounts.
  - Contains the hardcoded mobile admin bootstrap path noted below.
- `src/app/api/admin/login/route.ts`
  - Legacy/admin email-password login backed by the `admins` table.
- `src/app/api/auth/public/login/route.ts`
  - Public mobile/PIN login.
- `src/app/api/auth/public/signup/route.ts`
  - Public user signup.
- `src/app/api/auth/forgot-pin/route.ts`
  - PIN reset request creation.
- `src/app/api/auth/set-new-pin/route.ts`
  - PIN reset completion.
- `src/server/auth/jwt.ts`
  - JWT signing and verification.
- `src/server/auth/jwt-edge.ts`
  - Edge-compatible JWT verification used by middleware.
- `src/server/auth/http-auth.ts`
  - Bearer token and auth cookie lookup.
- `src/server/auth/require-admin.ts`
  - Admin-only API guard.
- `src/server/auth/require-roles.ts`
  - Role-based API guard.
- `src/server/auth/student-bearer.ts`
  - Student bearer token parser.
- `src/server/auth/parent-bearer.ts`
  - Parent bearer token parser.
- `src/server/auth/teacher-bearer.ts`
  - Teacher bearer token parser.
- `src/lib/session.ts`
  - Client-side token storage and decoded session handling.
- `src/lib/roles.ts`
  - Role definitions and role home redirects.

### Database

- `prisma/schema.prisma`
  - Main Prisma schema.
  - Important models include `Admin`, `User`, `Course`, `CourseSection`, `CourseVideo`, `CourseEnrollment`, `PaymentTransaction`, `Lead`, `StudentAccount`, and `ParentAccount`.
- `src/lib/prisma.ts`
  - Prisma client singleton.
- `src/server/db/pool.ts`
  - Raw PostgreSQL pool and `DATABASE_URL` handling.
- `scripts/migrations/*.sql`
  - Raw SQL migrations.
- `scripts/migrate.cjs`
  - Migration runner.
- `scripts/verify-db.cjs`
  - Database connectivity verification script.
- `scripts/seed-admin.cjs`
  - Admin seed script.
- `src/server/crm/leads-demos-admissions-db.ts`
  - Runtime table creation and raw SQL for CRM leads, demos, and admissions.
- `src/server/batches/batches-db.ts`
  - Runtime table creation and batch logic; contains destructive SQL noted below.
- `src/server/attendance/attendance-db.ts`
  - Attendance and batch progress data access.
- `src/server/parents/parents-portal-db.ts`
  - Parent portal tables, notifications, and payment status data access.

### Payments

- `src/app/api/payments/create-order/route.ts`
  - Creates Razorpay orders and pending `PaymentTransaction` rows.
- `src/app/api/payments/verify/route.ts`
  - Verifies Razorpay payment signatures and marks transactions/leads as paid.
- `src/lib/razorpay.ts`
  - Razorpay client and signature verification.
- `src/components/payments/PaymentButton.tsx`
  - Client-side Razorpay checkout integration.
- `src/components/admin/AdminPaymentsPage.tsx`
  - Admin payment ledger UI.
- `src/lib/payments-ledger-store.ts`
  - Legacy/localStorage payment ledger helper still present.

### Courses

- `src/app/courses/page.tsx`
  - Public courses listing page.
- `src/app/courses/[id]/page.tsx`
  - Public course detail/player route.
- `src/app/dashboard/courses/[id]/page.tsx`
  - Legacy dashboard course player route.
- `src/app/student/courses/page.tsx`
  - Student course list.
- `src/app/api/courses/route.ts`
  - Public course listing API.
- `src/app/api/courses/[id]/enroll/route.ts`
  - Course enrollment API.
- `src/app/api/courses/[id]/progress/route.ts`
  - Course progress API.
- `src/app/api/courses/me/enrollments/route.ts`
  - Current user's course enrollments.
- `src/app/api/admin/courses/route.ts`
  - Admin course CRUD list/create.
- `src/app/api/admin/courses/[id]/route.ts`
  - Admin course get/update/delete.
- `src/app/api/admin/courses/upload/route.ts`
  - Cloudinary course image upload.
- `src/app/api/admin/courses/[id]/sections/route.ts`
  - Course section creation.
- `src/app/api/admin/courses/[id]/sections/[sectionId]/route.ts`
  - Course section update/delete.
- `src/components/admin/RecordedCourseForm.tsx`
  - Admin course form.
- `src/components/admin/RecordedCoursesList.tsx`
  - Admin courses list.
- `src/components/admin/RecordedCourseSectionsManager.tsx`
  - Admin section/video manager.
- `src/components/courses/DashboardCoursePlayer.tsx`
  - Course playback UI.
- `src/components/courses/RoleCoursesSection.tsx`
  - Role-targeted courses UI.
- `src/lib/recorded-courses.ts`
  - Course helper logic.

### Middleware

- `src/middleware.ts`
  - Page and API route protection.
  - Defines `PAGE_GUARDS`, admin API role rules, payment API role rules, internal student/parent API role rules, dashboard legacy redirects, and matcher config.
  - `/courses` and `/courses/:path*` are included in the matcher, but the current middleware logic does not apply a role guard to them.

## 3. Destructive SQL Or Hardcoded Credentials

### Destructive SQL

- `src/server/batches/batches-db.ts`
  - `teardownLmsArtifacts()` runs before ensuring batch tables.
  - Destructive statements found:
    - Line 9: `DROP TABLE IF EXISTS course_progress CASCADE`
    - Line 10: `DROP TABLE IF EXISTS lessons CASCADE`
    - Line 11: `DROP TABLE IF EXISTS courses CASCADE`
    - Line 13: `ALTER TABLE IF EXISTS batches DROP COLUMN IF EXISTS course_id`
  - Risk: `DROP TABLE IF EXISTS courses CASCADE` can delete the Prisma-backed recorded courses table used by the current course system.
  - Additional schema drift risk:
    - Line 24 creates `batches.duration` with `CHECK (duration IN (12, 25))`.
    - `prisma/schema.prisma` comments indicate duration is intended to be a plain `Int` where any number of days is valid.

### Hardcoded Credentials

- `src/app/api/auth/internal/login/route.ts`
  - Line 10: `DEFAULT_ADMIN_MOBILE = "9946930723"`
  - Line 11: `DEFAULT_ADMIN_PIN = "1234"`
  - Line 41: `ensureMobileAdminAccess()` auto-creates or upgrades this mobile number to admin access.
  - Line 76: hardcoded local admin email `admin.9946930723@motiva.local`.
  - Risk: this is effectively a production backdoor if deployed unchanged.

### Related Security Observations

- `src/lib/ratelimit.ts` defines Upstash-backed limiters (`authLimiter`, `publicLimiter`, `apiLimiter`), but no usage was found in the app routes during inspection.
- Auth is split across:
  - HttpOnly cookies: `motiva_admin_auth`, `motiva_user_auth`
  - Local storage token: `motiva-auth-token`
  - Bearer-only route helpers for some student/parent/teacher APIs
- This mixed model increases the chance of inconsistent protection or client/server auth drift.

## 4. Rollback Plan

No app logic has been changed yet. Current change set should only include this report file.

If a future stabilization change causes a problem:

1. Confirm current branch and status:
   - `git branch --show-current`
   - `git status --short`
2. Review the exact diff:
   - `git diff`
3. Revert only the problematic commit if already committed:
   - `git revert <commit-sha>`
4. If changes are uncommitted, restore only the specific changed files after confirming they are not user-owned work:
   - `git restore <path>`
5. Re-run the safety checks:
   - `npm run lint`
   - `npx prisma validate`
   - `npm run build`
6. For any database-affecting change:
   - Take a database backup before deployment.
   - Avoid running code paths that call `src/server/batches/batches-db.ts` until destructive SQL is removed.
   - If data loss occurs, restore from the most recent Railway/Postgres backup.
7. For deployment rollback:
   - Re-deploy the previous known-good Railway deployment.
   - Restore previous environment variables if auth/payment-related variables were changed.
   - Verify login, admin dashboard, courses, payments, and student/parent portals after rollback.

