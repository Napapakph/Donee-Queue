-- ============================================================
-- Donee Queue — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── Profiles (linked to auth.users) ──────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text default 'My Art Studio',
  slug text unique,
  avatar text,
  bio text default 'Welcome to my commission page!',
  contact_channels jsonb default '[]'::jsonb,
  app_settings jsonb default '{}'::jsonb,
  commission_status text default 'open',
  tos text default '## Terms of Service',
  is_pro boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Work Types ────────────────────────────────────────────────────────────────
create table if not exists work_types (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  base_price numeric default 0,
  estimated_duration_days int default 1,
  visible boolean default true,
  examples jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- ── Scale Types ───────────────────────────────────────────────────────────────
create table if not exists scale_types (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  price_modifier numeric default 0,
  price_modifier_type text default 'percentage',
  duration_modifier_days int default 0,
  examples jsonb default '[]'::jsonb
);

-- ── Platforms ─────────────────────────────────────────────────────────────────
create table if not exists platforms (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null
);

-- ── Showcase Images ───────────────────────────────────────────────────────────
create table if not exists showcase_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  url text not null,
  caption text,
  work_type_tag text,
  is_nsfw boolean default false,
  sort_order int default 0
);

-- ── Queue Cards ───────────────────────────────────────────────────────────────
create table if not exists queue_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  customer_name text not null,
  platform_id text,
  work_type_id text,
  scale_type_id text,
  description text,
  price numeric default 0,
  is_commercial boolean default false,
  is_public boolean default true,
  is_nsfw boolean default false,
  quantity int default 1,
  brief_received boolean default false,
  payment_status text default 'unpaid',
  commission_date date,
  deadline_date date,
  progress text default 'Waiting',
  notes text,
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Income Entries ────────────────────────────────────────────────────────────
create table if not exists income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  amount numeric not null,
  source text,
  category text default 'Other',
  is_from_queue boolean default false,
  queue_card_id uuid,
  created_at timestamptz default now()
);

-- ── Expense Entries ───────────────────────────────────────────────────────────
create table if not exists expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  amount numeric not null,
  category text default 'Other',
  description text,
  receipt text
);

-- ── Tax Deduction Types ───────────────────────────────────────────────────────
create table if not exists tax_deduction_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text default 'percentage',
  value numeric not null,
  applies_to_category text
);

-- ── Notifications ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table profiles enable row level security;
alter table work_types enable row level security;
alter table scale_types enable row level security;
alter table platforms enable row level security;
alter table showcase_images enable row level security;
alter table queue_cards enable row level security;
alter table income_entries enable row level security;
alter table expense_entries enable row level security;
alter table tax_deduction_types enable row level security;
alter table notifications enable row level security;

-- Profiles: anyone can read (for guest view), only owner can write
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Queue cards: public ones readable by all, private by owner only
create policy "queue_cards_public_select" on queue_cards for select
  using (is_public = true OR auth.uid() = user_id);
create policy "queue_cards_owner_all" on queue_cards for all
  using (auth.uid() = user_id);

-- Showcase images: all can view
create policy "showcase_select_all" on showcase_images for select using (true);
create policy "showcase_owner_all" on showcase_images for all using (auth.uid() = user_id);

-- Work types: all can view
create policy "work_types_select_all" on work_types for select using (true);
create policy "work_types_owner_all" on work_types for all using (auth.uid() = user_id);

-- Scale types: all can view
create policy "scale_types_select_all" on scale_types for select using (true);
create policy "scale_types_owner_all" on scale_types for all using (auth.uid() = user_id);

-- Platforms: owner only
create policy "platforms_owner_all" on platforms for all using (auth.uid() = user_id);

-- Private tables: owner only
create policy "income_owner_all" on income_entries for all using (auth.uid() = user_id);
create policy "expense_owner_all" on expense_entries for all using (auth.uid() = user_id);
create policy "tax_owner_all" on tax_deduction_types for all using (auth.uid() = user_id);
create policy "notif_owner_all" on notifications for all using (auth.uid() = user_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'My Art Studio'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
