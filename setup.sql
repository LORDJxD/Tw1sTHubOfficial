-- Tw1sTHub Official - Supabase Database Setup & Security Configuration
-- Run this script in your Supabase SQL Editor.

-- 1. Ensure profiles table structure exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  is_approved boolean default false,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure required columns exist if profiles was already created
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 2. Create messages table for Community Chat
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  text text not null,
  sender_email text not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- 4. RLS Policies for Profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles
  for update using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 5. RLS Policies for Messages
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages" on public.messages
  for select using (true);

drop policy if exists "Authenticated users can insert messages" on public.messages;
create policy "Authenticated users can insert messages" on public.messages
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Admins can delete messages" on public.messages;
create policy "Admins can delete messages" on public.messages
  for delete using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 6. Trigger to automatically create a profile row upon signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_approved, is_admin)
  values (
    new.id,
    new.email,
    case when lower(new.email) = 'rowelljoshuaendriga@gmail.com' then true else false end,
    case when lower(new.email) = 'rowelljoshuaendriga@gmail.com' then true else false end
  )
  on conflict (id) do update set
    email = excluded.email,
    is_approved = case when lower(excluded.email) = 'rowelljoshuaendriga@gmail.com' then true else public.profiles.is_approved end,
    is_admin = case when lower(excluded.email) = 'rowelljoshuaendriga@gmail.com' then true else public.profiles.is_admin end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Enable Realtime Publications for live updates
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.messages;
