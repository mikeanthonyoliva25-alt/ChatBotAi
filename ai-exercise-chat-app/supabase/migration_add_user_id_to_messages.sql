-- Migration: add user_id to historical tables and backfill
-- Run in Supabase SQL Editor.

alter table public.assessments
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.plans
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.messages
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Backfill user_id from conversations when an owner column exists.
do $$
declare
  conv_owner_col text;
begin
  select column_name
  into conv_owner_col
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'conversations'
    and column_name in ('user_id', 'owner_id', 'profile_id', 'account_id')
  order by case column_name
    when 'user_id' then 1
    when 'owner_id' then 2
    when 'profile_id' then 3
    when 'account_id' then 4
    else 100
  end
  limit 1;

  if conv_owner_col is not null then
    execute format(
      'update public.assessments a
       set user_id = c.%I
       from public.conversations c
       where a.conversation_id = c.id
         and a.user_id is null',
      conv_owner_col
    );

    execute format(
      'update public.plans p
       set user_id = c.%I
       from public.conversations c
       where p.conversation_id = c.id
         and p.user_id is null',
      conv_owner_col
    );

    execute format(
      'update public.messages m
       set user_id = c.%I
       from public.conversations c
       where m.conversation_id = c.id
         and m.user_id is null',
      conv_owner_col
    );
  else
    raise notice 'No owner column found on public.conversations; skipped backfill.';
  end if;
end $$;

create index if not exists assessments_user_id_idx on public.assessments(user_id);
create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists messages_user_id_idx on public.messages(user_id);

-- Keep message policies compatible during migration.
drop policy if exists "Users can view own messages" on public.messages;
drop policy if exists "Users can insert own messages" on public.messages;

do $$
declare
  has_conv_user_id boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversations'
      and column_name = 'user_id'
  ) into has_conv_user_id;

  if has_conv_user_id then
    execute $policy$
      create policy "Users can view own messages"
        on public.messages
        for select
        using (
          auth.uid() = user_id
          or conversation_id in (
            select id from public.conversations where user_id = auth.uid()
          )
        )
    $policy$;

    execute $policy$
      create policy "Users can insert own messages"
        on public.messages
        for insert
        with check (
          auth.uid() = user_id
          or conversation_id in (
            select id from public.conversations where user_id = auth.uid()
          )
        )
    $policy$;
  else
    execute $policy$
      create policy "Users can view own messages"
        on public.messages
        for select
        using (auth.uid() = user_id)
    $policy$;

    execute $policy$
      create policy "Users can insert own messages"
        on public.messages
        for insert
        with check (auth.uid() = user_id)
    $policy$;
  end if;
end $$;
