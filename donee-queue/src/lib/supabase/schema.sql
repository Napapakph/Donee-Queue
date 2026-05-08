-- ── Supabase schema for Donee Queue ──────────────────────────────────────────
-- Run this in the Supabase SQL editor

-- Boards
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Queue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columns per board
create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  label text not null,
  type text not null check (type in ('text','number','dropdown','checkbox','date')),
  options jsonb,
  width int default 160,
  "order" int not null default 0
);

-- Rows per board
create table if not exists rows (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  cells jsonb not null default '{}',
  "order" int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS (disable for local dev, enable for production)
alter table boards enable row level security;
alter table columns enable row level security;
alter table rows enable row level security;

-- Open policies for dev (restrict in production!)
create policy "Allow all boards" on boards for all using (true);
create policy "Allow all columns" on columns for all using (true);
create policy "Allow all rows" on rows for all using (true);
