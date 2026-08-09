# PLATE

A personal meal/macro, weight, and workout tracker with live barcode scanning
(works on iPhone) and a progress-photo timeline.

This is a real standalone web app — not a Claude artifact — so live camera
barcode scanning works properly, and your data lives in your own private
Supabase database instead of browser storage.

## What's inside

- **React + Vite** frontend (`src/`)
- **Supabase** — auth (email/password login) + Postgres database + private
  photo storage
- **ZXing** (`@zxing/browser`) for live barcode decoding — works in Safari/iOS,
  unlike the browser-native `BarcodeDetector` API
- **Open Food Facts** for barcode/food-name nutrition lookups (unchanged from
  before — no API key needed)

## Deploy it — step by step

### 1. Create your accounts (free)
- [github.com](https://github.com) — where the code lives
- [vercel.com](https://vercel.com) — sign up with your GitHub account, this hosts the live site
- [supabase.com](https://supabase.com) — this is your database

### 2. Set up Supabase
1. In Supabase, create a new project (pick any name/region, set a database password and store it somewhere safe).
2. Open the **SQL Editor** → **New query**, paste in the entire contents of `supabase/setup.sql` from this project, and click **Run**. This creates your tables, turns on row-level security so only you can ever read your own data, and sets up private photo storage.
3. Go to **Settings → API**. You'll need two values from this page in step 4: the **Project URL** and the **anon public** key.
4. Go to **Authentication → Providers**, and confirm **Email** is enabled (it is by default). Optionally, under **Authentication → Settings**, you can turn off "Confirm email" if you'd rather skip the email-confirmation step for your own personal account.

### 3. Push this code to GitHub
1. Create a new empty repository on GitHub (e.g. `plate`).
2. Upload all the files in this folder to it — GitHub's web UI has an "Add file → Upload files" button that accepts drag-and-drop, no command line needed.

### 4. Deploy on Vercel
1. In Vercel, click **Add New → Project**, and import the GitHub repo you just created.
2. Vercel will auto-detect this as a Vite project — leave the build settings as default.
3. Before deploying, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → the Project URL from Supabase step 2.3
   - `VITE_SUPABASE_ANON_KEY` → the anon public key from Supabase step 2.3
4. Click **Deploy**. About a minute later you'll have a live link like `plate-yourname.vercel.app`.

### 5. Use it
1. Open the link on your iPhone in Safari.
2. Create an account (this is your own private login, separate from Claude/Supabase/anything else — just an email and password you choose).
3. Try **Food → Scan with camera** — Safari should now prompt for camera access normally, and live barcode scanning should work.
4. Tap the Share icon → **Add to Home Screen** for the full app-like experience.

### 6. Bring your data back in
- Re-log anything recent from the Claude-artifact version by hand.
- Use **Settings → Import from MyFitnessPal** again with your exported CSVs — same as before.

## Making changes later

Whenever you want a new feature or a fix: I update the code, you replace the
changed file(s) in your GitHub repo through the web UI, and Vercel
automatically rebuilds and redeploys within about a minute. No re-setup
needed — the GitHub↔Vercel↔Supabase connections stay wired up permanently.

## Local development (optional)

If you ever want to run this on your own computer instead of just editing on
GitHub's website, you'll need [Node.js](https://nodejs.org) installed, then:

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + key
npm run dev
```

## Honesty note

This code follows the documented APIs for Supabase and ZXing carefully and
has been checked for syntax errors, but it hasn't been run through a live
`npm install` + build (this environment has no internet access to install
packages). If Vercel's build throws an error the first time, paste it back to
me and I'll fix it — that's a normal part of shipping something like this,
not a sign anything was done carelessly.
