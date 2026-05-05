-- Member directory table for Chitpavan Nadegek Manusya
-- Apply in Supabase SQL editor or via Supabase CLI when linked to a project.

create extension if not exists "pgcrypto";

create table public.directory_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text not null,
  business_name text not null,
  profile_photo_path text,
  contact_number text not null,
  whatsapp_number text,
  email text not null,
  city text not null,
  area_locality text,

  business_category text not null,
  sub_category text not null,
  business_types text[] not null default '{}',
  keywords_tags text not null,
  products_services text not null,
  specialization text,
  years_experience text,
  price_ranges text[] not null default '{}',

  business_address text,
  service_area text[] not null default '{}',
  google_maps_link text,

  website text,
  instagram text,
  facebook text,
  linkedin text,

  usp text,
  certifications text,
  awards text,

  looking_for text[] not null default '{}',
  preferred_categories_connect text[] not null default '{}',

  portfolio_paths text[] not null default '{}',
  visiting_card_path text,

  target_customers text,
  referred_by text,

  consent_share boolean not null default false,

  constraint directory_members_consent_ck check (consent_share is true),
  constraint directory_members_keywords_ck check (char_length(trim(keywords_tags)) >= 2)
);

create index directory_members_created_at_idx on public.directory_members (created_at desc);
create index directory_members_category_idx on public.directory_members (business_category);
create index directory_members_city_idx on public.directory_members (city);
create index directory_members_business_types_gin on public.directory_members using gin (business_types);
create index directory_members_looking_for_gin on public.directory_members using gin (looking_for);

comment on table public.directory_members is 'Community business directory; reads/writes from Next.js using the Supabase service role.';

alter table public.directory_members enable row level security;

create policy directory_members_select_deny_public
  on public.directory_members
  for select
  to anon, authenticated
  using (false);

create policy directory_members_modify_deny_public
  on public.directory_members
  for all
  to anon, authenticated
  using (false)
  with check (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-uploads',
  'member-uploads',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

create policy storage_member_uploads_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'member-uploads');

-- Inserts/deletes via service role bypass RLS. Do not expose the service role key client-side.
