-- Tez Extractor: loads table
-- One row per extracted rate confirmation.

create table if not exists loads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who and what
  broker text,
  load_number text,

  -- Pickup
  pickup_location text,
  pickup_date date,
  pickup_window text,

  -- Delivery
  delivery_location text,
  delivery_date date,
  delivery_window text,

  -- Load details
  miles numeric,
  weight numeric,
  equipment text,
  rate numeric,

  -- Pipeline state
  status text not null default 'extracted',
  needs_review boolean not null default true,
  field_confidence jsonb,

  -- Provenance
  raw_text text,
  source_file text
);

-- Lock the table down: no anonymous access. The app talks to the database
-- only from server side API routes using the secret key, which bypasses RLS.
alter table loads enable row level security;

-- New Supabase projects grant no default table access to API roles.
grant all on table loads to service_role;
