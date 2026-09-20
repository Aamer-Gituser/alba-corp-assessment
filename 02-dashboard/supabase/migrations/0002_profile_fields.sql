-- Add optional contact fields to profiles
alter table public.profiles
  add column if not exists owner_name text,
  add column if not exists phone      text;
