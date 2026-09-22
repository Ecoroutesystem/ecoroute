create table if not exists public.companies (
    id text primary key,
    name text not null,
    email text not null default '',
    phone text not null default '',
    address text not null default '',
    tin text not null default '',
    auth_user_id uuid references auth.users (id) on delete set null,
    registration text not null unique,
    location text not null,
    customers integer not null default 0,
    status text not null default 'Pending approval' check (
        status in (
            'Pending approval',
            'Approved',
            'Rejected',
            'Cancelled'
        )
    ),
    created_at timestamptz not null default now()
);

alter table public.companies
add column if not exists email text not null default '';

alter table public.companies
add column if not exists phone text not null default '';

alter table public.companies
add column if not exists address text not null default '';

alter table public.companies
add column if not exists tin text not null default '';

alter table public.companies
add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists companies_auth_user_id_idx on public.companies (auth_user_id)
where
    auth_user_id is not null;

create unique index if not exists companies_tin_idx on public.companies (tin)
where
    tin <> '';

alter table public.companies
drop constraint if exists companies_status_check;

alter table public.companies
add constraint companies_status_check check (
    status in (
        'Pending approval',
        'Approved',
        'Rejected',
        'Cancelled'
    )
);

create table if not exists public.customers (
    id text primary key,
    name text not null,
    phone text not null default '',
    location text not null,
    plan text not null default 'Weekly · 240 kg',
    balance text not null default '$0.00',
    status text not null default 'Active' check (
        status in (
            'Active',
            'Suspended',
            'Archived'
        )
    ),
    created_at timestamptz not null default now()
);

create table if not exists public.collections (
    id text primary key,
    time text not null,
    date date not null,
    address text not null,
    customer text not null,
    driver text not null default 'Unassigned',
    vehicle text not null default 'Unassigned',
    status text not null default 'Scheduled' check (
        status in (
            'Scheduled',
            'In Progress',
            'Completed',
            'Missed',
            'Cancelled'
        )
    ),
    created_at timestamptz not null default now()
);

create index if not exists collections_date_idx on public.collections (date);

create index if not exists collections_status_idx on public.collections (status);

create index if not exists customers_status_idx on public.customers (status);

create index if not exists companies_status_idx on public.companies (status);

alter table public.companies enable row level security;

alter table public.customers enable row level security;

alter table public.collections enable row level security;

-- The API uses the server-only Supabase secret key and enforces workspace access there.
-- Do not expose that key to the browser or create public policies for these tables.

insert into
    public.companies (
        id,
        name,
        registration,
        location,
        customers,
        status
    )
values (
        'CMP-0018',
        'GreenLine Waste Services',
        'REG-2026-104',
        'Kigali City',
        1284,
        'Approved'
    ),
    (
        'CMP-0021',
        'CleanWay Collection Co.',
        'REG-2026-119',
        'Musanze District',
        642,
        'Pending approval'
    ) on conflict (id) do nothing;

insert into
    public.customers (
        id,
        name,
        phone,
        location,
        plan,
        balance,
        status
    )
values (
        'CUS-0081',
        'Kilimani Estate',
        '+254 712 441 080',
        'Kigali Sector · Cell 04 · Village A',
        'Weekly · 240 kg',
        '$0.00',
        'Active'
    ) on conflict (id) do nothing;

insert into
    public.collections (
        id,
        time,
        date,
        address,
        customer,
        driver,
        vehicle,
        status
    )
values (
        'COL-1024',
        '08:30',
        '2026-09-22',
        'Kilimani · 14 households',
        'Kilimani Estate',
        'Maya Okafor',
        'KCA 482M',
        'In Progress'
    ),
    (
        'COL-1025',
        '10:00',
        '2026-09-22',
        'Lavington · 28 households',
        'Lavington Heights',
        'Jon Bell',
        'KDB 104A',
        'Scheduled'
    ) on conflict (id) do nothing;

insert into
    storage.buckets (id, name, public)
values ('avatars', 'avatars', true) on conflict (id) do
update
set
    public = true;

drop policy if exists "Public avatar images are readable" on storage.objects;

drop policy if exists "Users can upload their own avatar" on storage.objects;

drop policy if exists "Users can update their own avatar" on storage.objects;

create policy "Public avatar images are readable" on storage.objects for
select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'admin' and (storage.filename(name) = auth.uid()::text));

create policy "Users can update their own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'admin' and (storage.filename(name) = auth.uid()::text))
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = 'admin' and (storage.filename(name) = auth.uid()::text));