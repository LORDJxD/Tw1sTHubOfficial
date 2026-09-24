-- Create a table for chat messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  text text not null,
  sender_email text not null
);

-- Enable Row Level Security
alter table public.messages enable row level security;

-- Set up security policies for messages
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages" on public.messages
  for select using (true);

drop policy if exists "Authenticated users can insert messages" on public.messages;
create policy "Authenticated users can insert messages" on public.messages
  for insert with check (auth.role() = 'authenticated');
