-- Run this once in Supabase → SQL Editor

-- Conversation state per customer (one row per phone number)
create table if not exists sessions (
  phone       text primary key,
  step        text not null default 'idle',
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Every completed request: event quote, class inquiry or contact
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  phone       text not null,
  name        text,
  type        text not null check (type in ('evento', 'clase', 'contacto')),
  data        jsonb not null default '{}'::jsonb,
  status      text not null default 'nuevo'
);

create index if not exists leads_created_at_idx on leads (created_at desc);

-- Lock both tables: only the server (service role key) can read/write them
alter table sessions enable row level security;
alter table leads    enable row level security;
