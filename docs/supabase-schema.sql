create extension if not exists pgcrypto;

create table if not exists public.workspace_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 120),
  workspace jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_records_owner_updated_idx
  on public.workspace_records (owner_id, updated_at desc);

alter table public.workspace_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_records'
      and policyname = 'workspace_records_select_own'
  ) then
    create policy workspace_records_select_own
      on public.workspace_records
      for select
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_records'
      and policyname = 'workspace_records_insert_own'
  ) then
    create policy workspace_records_insert_own
      on public.workspace_records
      for insert
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_records'
      and policyname = 'workspace_records_update_own'
  ) then
    create policy workspace_records_update_own
      on public.workspace_records
      for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_records'
      and policyname = 'workspace_records_delete_own'
  ) then
    create policy workspace_records_delete_own
      on public.workspace_records
      for delete
      using (auth.uid() = owner_id);
  end if;
end $$;

create or replace function public.set_workspace_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspace_records_set_updated_at on public.workspace_records;

create trigger workspace_records_set_updated_at
  before update on public.workspace_records
  for each row
  execute function public.set_workspace_records_updated_at();
