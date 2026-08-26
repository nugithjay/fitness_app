# PLATE

A personal dashboard for weight and workout analytics — populated by importing
data from Strong and Garmin Connect, with manual weight logging built in.

No food tracking. No live workout logging. This is a pure analytics dashboard.

## What's inside

- **React + Vite** frontend (`src/`)
- **Supabase** — auth (email/password login) + Postgres database + private
  photo storage
- Import pipelines for **Strong** (workout CSV) and **Garmin Connect**
  (Activities CSV) — see in-app instructions under the Workouts tab
- Manual weight logging, with CSV import support (e.g. from MyFitnessPal's
  "Your Progress" export) for backfilling history

## Deploy it — step by step

### 1. Create your accounts (free)
- [github.com](https://github.com)
- [vercel.com](https://vercel.com) — sign up with your GitHub account
- [supabase.com](https://supabase.com)

### 2. Set up Supabase
1. Create a new project.
2. SQL Editor → New query → paste the entire contents of `supabase/setup.sql` → Run.
3. Settings → API: note the **Project URL** and **anon/publishable key**.

### 3. Push this code to GitHub
Upload every file in this folder to a new repo — GitHub's web UI supports
drag-and-drop, no command line needed. Make sure hidden folders like
`.github` come along too.

### 4. Deploy on Vercel
1. Add New → Project → import the repo.
2. Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   with the values from step 2.3. Check all three environments (Production/
   Preview/Development).
3. Deploy.

### 5. Bring in your data
- **Workouts tab → From Strong**: Strong app → Settings → Export Data → upload the CSV.
- **Workouts tab → From Garmin**: connect.garmin.com (web) → Activities → gear
  icon → Export CSV → upload here.
- **Settings → Import weight data**: any CSV/XLSX with a date and weight
  column (e.g. MyFitnessPal's "Your Progress" export).

## Keeping Supabase awake

Free-tier Supabase projects pause after about a week with no database
activity. `.github/workflows/keepalive.yml` pings the database twice a week
to prevent that — it needs two GitHub repo secrets (`SUPABASE_URL` and
`SUPABASE_ANON_KEY`, same values as above) under Settings → Secrets and
variables → Actions.

## Making changes later

I update the code, you replace the changed file(s) in your GitHub repo, and
Vercel automatically rebuilds. No re-setup needed.
