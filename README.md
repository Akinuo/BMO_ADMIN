# B.M.O Admin Dashboard

A **separate website** for instructors to track student progress in the B.M.O (Basic Machine Operation / VAL Guide) app.
Same stack as the student app — Next.js 14 (App Router) + TypeScript + Tailwind + Supabase — and it reads the **same Supabase database**, read-only.

| Page | What it shows |
| --- | --- |
| **Overview** | Total students (summed from the database), active this week, average progress, finished-the-course and certified counts, where everyone is, 30-day activity chart, lesson-by-lesson completion, top students, and students who need a nudge |
| **Students** | Every student with rank, progress, lessons, assessment result, status and last activity. Search, filter, sort, **Export CSV** |
| **Student detail** | One student: rank, progress, each lesson step-by-step, assessment, recent steps |
| **Leaderboard** | Podium + full ranking, with the ranking rule spelled out |

## Is it possible to connect it to the same database? Yes — and nothing in the student app changes

The admin site signs in with a normal Supabase account that has `role = 'admin'` and calls four **read-only SQL functions**
(`supabase/admin_dashboard.sql`). Each function checks `is_admin()` first — the same check your existing admin policies use — so only admins get data back.

- Nothing is created, edited or deleted in any student table. No existing policy is touched. The student app is unaffected.
- No `service_role` key anywhere. The functions run as `SECURITY DEFINER` so they can read emails and names from `auth.users`, which a browser can never read directly.
- A student who signs in here just sees "This account isn't an admin", and the database itself refuses the calls.

## Set up (about 10 minutes)

1. **Install**
   ```bash
   npm install
   ```
2. **Add the database functions.** Supabase → *SQL Editor* → paste and run `supabase/admin_dashboard.sql`.
   Use the *same* project as the student app (after `0001_init.sql` and `0002_assessment.sql` have been run). It is safe to re-run.
3. **Make yourself an admin.** Create the account first (sign up in the student app, or use Google), then run:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   Admins are never counted as students. Give this role only to instructors — the dashboard shows student emails.
4. **Connect the site.** Copy `.env.example` to `.env.local` and paste the same two values the student app uses (Supabase → Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. **Run it**
   ```bash
   npm run dev      # http://localhost:3001
   ```
   Sign in with the admin account (email + password, or Google).

## Deploy (separate from the student app)

1. Push this folder to its **own** Git repo and import it in Vercel as a **new project** (framework: Next.js, no extra settings).
2. Add the same two environment variables under Project Settings → Environment Variables.
3. *Only if you use "Continue with Google":* Supabase → Authentication → URL Configuration → add `https://<your-admin-domain>/**` to **Redirect URLs**.
   Leave the **Site URL** as it is — the student app depends on it. Email + password sign-in needs no change.

The site sends `noindex` headers and a `robots.txt` that blocks crawlers, because it lists student emails.

## How things are counted

- **Student** = an account with role `student` (or no profile row yet), a confirmed email, and not deleted. Admins and never-confirmed sign-ups (who can't log in) are left out.
  To count unconfirmed sign-ups too, delete the `u.email_confirmed_at is not null` lines in the SQL file and re-run it.
- **Progress** = steps completed ÷ total steps in the course. A step counts when the student answers its quiz question correctly (that is what the student app saves). Total steps and lessons are read from your `lessons` / `steps` tables, so editing content updates the dashboard automatically.
- **Status:** *Not started* (0 steps) · *In progress* · *Course complete* (every step done, final assessment not passed yet) · *Certified* (passed the final assessment).
- **Stalled** = not finished and no progress for 14 days, counted from their last step (or from sign-up if they never started). **Active** = completed a step in the last 7 days. Both are in `src/lib/config.ts`.
- Dates and day boundaries use Philippine time (`Asia/Manila`), also in `src/lib/config.ts`.

## Ranking

Students who have completed at least one step are ranked by:

1. **Steps completed** — more is better.
2. **Final-assessment score %** — only matters once the course is finished. Any attempt ranks above no attempt.
3. **Who got there first** — the student whose latest step was completed earlier ranks higher.

Students with exactly the same result share a rank (1, 2, 2, 4 …), shown with `=`. Students with no steps aren't ranked. The logic is one small, tested file: `src/lib/ranking.ts`.

## Good to know

- The student app saves only *correct* answers, so the dashboard can't show wrong-answer counts or per-question accuracy.
- "Who got there first" uses the time a step was saved to the database. If a student works offline, it is recorded when their device next syncs.
- The student list is fetched in pages of 1,000, so totals stay correct beyond Supabase's default row cap.
- Each page view makes 2–3 small database calls and nothing is polled, so it is well within the Supabase free tier. Use the **Refresh** button for fresh numbers.
- CSV exports contain student emails. Handle them as personal data under your privacy statement. Names that begin with `=`, `+`, `-` or `@` are neutralised so they can't run as spreadsheet formulas.

## Scripts

```bash
npm run dev         # dev server on :3001
npm run build       # production build
npm run typecheck   # TypeScript
npm test            # unit tests for ranking + CSV export
```

## Project layout

```
supabase/admin_dashboard.sql     the four read-only, admin-only SQL functions
src/lib/ranking.ts               ranking rule (tested)
src/lib/students.ts              status, progress %, stalled flag, summary numbers
src/lib/data.ts                  server-side data fetching (admin-gated)
src/lib/config.ts                time zone, active/stalled days, page sizes
src/middleware.ts                keeps sessions fresh, sends signed-out visitors to /login
src/app/(dashboard)/…            Overview, Students, Student detail, Leaderboard
```
