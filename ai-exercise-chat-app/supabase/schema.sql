-- Minimal schema for AI Exercise Chat App
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  age int,
  sex text,
  height_cm numeric(6,2),
  weight_kg numeric(6,2),
  bmi numeric(5,2),
  body_condition text,
  goal text,
  days_per_week int,
  minutes_per_day int,
  busy_level text,
  location text,
  exercise_preferences text[] default '{}',
  available_tools text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text,
  risk_level text,
  forecast_week4 text,
  forecast_week8 text,
  forecast_week12 text,
  weekly_plan text[] default '{}',
  summary text,
  created_at timestamptz not null default now()
);

-- Enable RLS for auth-protected tables
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.assessments enable row level security;
alter table public.plans enable row level security;

-- RLS Policies: Users can only see their own data
create policy "Users can view own conversations"
  on public.conversations
  for select
  using (auth.uid() = user_id);

create policy "Users can create own conversations"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can view own messages"
  on public.messages
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.messages
  for insert
  with check (auth.uid() = user_id);

create policy "Users can view own assessments"
  on public.assessments
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own assessments"
  on public.assessments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can view own plans"
  on public.plans
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on public.plans
  for insert
  with check (auth.uid() = user_id);
