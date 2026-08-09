-- PLATE — one-time Supabase setup.
-- In your Supabase project: SQL Editor > New query > paste this whole file > Run.

-- 1) Single key/value table holds all app data (profile, food log, weight log,
--    workout log, progress photo index) — mirrors the original app's storage model,
--    scoped per logged-in user.
create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

alter table user_data enable row level security;

drop policy if exists "select own data" on user_data;
create policy "select own data" on user_data
  for select using (auth.uid() = user_id);

drop policy if exists "insert own data" on user_data;
create policy "insert own data" on user_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own data" on user_data;
create policy "update own data" on user_data
  for update using (auth.uid() = user_id);

drop policy if exists "delete own data" on user_data;
create policy "delete own data" on user_data
  for delete using (auth.uid() = user_id);

-- 2) Private storage bucket for progress photos.
--    Files are stored under a path like  {user_id}/{photo_id}.jpg
insert into storage.buckets (id, name, public)
  values ('progress-photos', 'progress-photos', false)
  on conflict (id) do nothing;

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "view own photos" on storage.objects;
create policy "view own photos" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "delete own photos" on storage.objects;
create policy "delete own photos" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Done. Every row and every photo is only ever readable by the user who created it.
