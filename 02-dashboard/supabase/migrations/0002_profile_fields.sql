-- Add optional profile fields
alter table public.profiles
  add column if not exists owner_name text,
  add column if not exists phone      text,
  add column if not exists avatar_url text;
