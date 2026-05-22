# Production Launch Checklist

## Final QA

- Student journey: sign up, verify OTP/email, complete university/department/batch onboarding, reload, confirm dashboard still resolves the same cohort, open courses, videos, notes, solved answers, suggestions, billing, and profile.
- Admin CRUD: sign in as super admin, create/edit/archive universities, departments, batches, semesters, courses, content, students, instructors, payments, and suggestions. Confirm non-admin users receive 403 from `/api/admin/*`.
- Reload persistence: reload after login, onboarding, dashboard filters, payment submit, video progress, and admin edits. Confirm Supabase session cookies and persisted profile cohort survive.
- Cohort isolation: test at least four users: DIU/CSE/61, DIU/CSE/62, NSU/CSE/61, and DIU/BBA/61. Each student should only see their own cohort content and subscriptions.

## Database

- Backup before migration:
  ```bash
  supabase db dump --linked --file backups/pre-launch-$(date +%Y%m%d-%H%M%S).sql
  ```
- Apply production RLS:
  ```bash
  supabase db push --linked
  ```
- Verify RLS:
  ```sql
  select schemaname, tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
    and tablename in ('profiles', 'universities', 'departments', 'academic_batches', 'courses', 'video_lectures', 'previous_questions', 'study_notes', 'solved_answers', 'exam_suggestions');
  ```

## Seed Data

- Run production seed scripts only from a trusted operator machine with `SUPABASE_SERVICE_ROLE_KEY`; do not seed over HTTP.
- Confirm required hierarchy rows exist for each launch university, department, batch, current semester, billing plan, and sample course.
- Confirm no debug rows remain, especially `DEBUG UNIVERSITY`, `TEST_*`, or ad hoc schema-debug inserts.

## Launch

- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VIDEO_TOKEN_SECRET`, R2 variables, SMTP variables, and production `NEXT_PUBLIC_SITE_URL`.
- Rotate any key that appeared in local debug pages or logs before deploying.
- Run `pnpm build`.
- Deploy, smoke test `/`, `/login`, `/dashboard`, `/admin/login`, `/admin`, `/instructor/login`, and protected video/PDF access.
