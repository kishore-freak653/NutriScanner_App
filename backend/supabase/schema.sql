  -- NutriScanner schema. Paste into the Supabase SQL editor and run once.
  -- Safe to re-run: every statement is idempotent.

  create table if not exists public.users (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    email      text not null unique,
    phone      text,
    password   text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists public.food_records (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references public.users (id) on delete cascade,
    foods          jsonb not null
                  check (jsonb_typeof(foods) = 'array' and jsonb_array_length(foods) > 0),
    total_calories double precision not null default 0,
    total_protein  double precision not null default 0,
    total_fat      double precision not null default 0,
    total_carbs    double precision not null default 0,
    image_url      text,
    scan_note      text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
  );

  create index if not exists food_records_user_id_created_at_idx
    on public.food_records (user_id, created_at desc);

  create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

  drop trigger if exists users_set_updated_at on public.users;
  create trigger users_set_updated_at
    before update on public.users
    for each row execute function public.set_updated_at();

  drop trigger if exists food_records_set_updated_at on public.food_records;
  create trigger food_records_set_updated_at
    before update on public.food_records
    for each row execute function public.set_updated_at();

  -- Only the backend reaches these tables, using the service role key, which
  -- bypasses RLS. RLS with no policies blocks the public anon key, which would
  -- otherwise be able to read password hashes through Supabase's REST API.
  alter table public.users enable row level security;
  alter table public.food_records enable row level security;

  grant select, insert, update, delete on public.users, public.food_records to service_role;

  -- Added for meal labels, online photos, and water and weight tracking.
  alter table public.food_records
    add column if not exists meal_type text
      check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
    add column if not exists image_path text;

  -- Days come from the phone, so "today" follows the user's own time zone.
  create table if not exists public.water_logs (
    user_id uuid not null references public.users (id) on delete cascade,
    day     date not null,
    glasses integer not null check (glasses between 0 and 50),
    primary key (user_id, day)
  );

  create table if not exists public.weight_logs (
    user_id   uuid not null references public.users (id) on delete cascade,
    day       date not null,
    weight_kg double precision not null check (weight_kg between 20 and 500),
    primary key (user_id, day)
  );

  alter table public.water_logs enable row level security;
  alter table public.weight_logs enable row level security;

  grant select, insert, update, delete on public.water_logs, public.weight_logs to service_role;

  -- Expo push tokens, one row per device. A user can have several devices, and a
  -- device that changes hands moves to the new user because the token is the key.
  create table if not exists public.push_tokens (
    token      text primary key,
    user_id    uuid not null references public.users (id) on delete cascade,
    platform   text check (platform in ('android', 'ios')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

  drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
  create trigger push_tokens_set_updated_at
    before update on public.push_tokens
    for each row execute function public.set_updated_at();

  alter table public.push_tokens enable row level security;

  grant select, insert, update, delete on public.push_tokens to service_role;
