-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type mood_mode as enum ('zen', 'warrior');
create type audience_type as enum ('woman', 'man', 'non_binary', 'prefer_not_to_say', 'custom');
create type tone_type as enum ('soft', 'balanced', 'strong');

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings table
create table settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  mode mood_mode not null default 'zen',
  audience audience_type default 'prefer_not_to_say',
  tone tone_type not null default 'balanced',
  delivery_time time not null default '09:00:00',
  timezone text not null default 'UTC',
  themes text[] not null default array['focus', 'creativity'],
  language text not null default 'en',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- Cards table
create table cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  quote_text text not null,
  quote_author text,
  reflection text not null,
  action text not null,
  mantra text not null,
  mode mood_mode not null,
  audience_used audience_type,
  themes text[] not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, date)
);

-- Streaks table
create table streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completion_date date,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- Telemetry table
create table telemetry (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_type text not null,
  event_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generation quota table
create table generation_quotas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  generations_used integer not null default 0,
  max_generations integer not null default 2, -- 1 daily + 1 regen
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, date)
);

-- Create indexes
create index idx_cards_user_date on cards(user_id, date desc);
create index idx_telemetry_user_created on telemetry(user_id, created_at desc);
create index idx_generation_quotas_user_date on generation_quotas(user_id, date);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table settings enable row level security;
alter table cards enable row level security;
alter table streaks enable row level security;
alter table telemetry enable row level security;
alter table generation_quotas enable row level security;

-- RLS Policies

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Settings policies
create policy "Users can view own settings"
  on settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on settings for update
  using (auth.uid() = user_id);

-- Cards policies
create policy "Users can view own cards"
  on cards for select
  using (auth.uid() = user_id);

create policy "Users can insert own cards"
  on cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cards"
  on cards for update
  using (auth.uid() = user_id);

-- Streaks policies
create policy "Users can view own streaks"
  on streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on streaks for update
  using (auth.uid() = user_id);

-- Telemetry policies
create policy "Users can view own telemetry"
  on telemetry for select
  using (auth.uid() = user_id);

create policy "Users can insert own telemetry"
  on telemetry for insert
  with check (auth.uid() = user_id);

-- Generation quotas policies
create policy "Users can view own quotas"
  on generation_quotas for select
  using (auth.uid() = user_id);

create policy "Users can insert own quotas"
  on generation_quotas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quotas"
  on generation_quotas for update
  using (auth.uid() = user_id);

-- Functions

-- Function to handle new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  
  insert into settings (user_id)
  values (new.id);
  
  insert into streaks (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_settings_updated_at before update on settings
  for each row execute procedure update_updated_at_column();

create trigger update_streaks_updated_at before update on streaks
  for each row execute procedure update_updated_at_column();

-- Function to update streak when card is completed
create or replace function update_streak_on_completion()
returns trigger as $$
declare
  last_date date;
  current_date date := current_date;
begin
  -- Only update if completed status changed to true
  if new.completed = true and (old.completed is null or old.completed = false) then
    -- Get the user's current streak info
    select last_completion_date into last_date
    from streaks
    where user_id = new.user_id;
    
    -- Update streak based on completion pattern
    if last_date is null or last_date = current_date - interval '1 day' then
      -- Continue or start streak
      update streaks
      set 
        current_streak = current_streak + 1,
        longest_streak = greatest(longest_streak, current_streak + 1),
        last_completion_date = current_date
      where user_id = new.user_id;
    elsif last_date = current_date then
      -- Same day completion, no change to streak
      return new;
    else
      -- Streak broken, reset to 1
      update streaks
      set 
        current_streak = 1,
        longest_streak = greatest(longest_streak, 1),
        last_completion_date = current_date
      where user_id = new.user_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for streak updates
create trigger update_streak_on_card_completion
  after update on cards
  for each row execute procedure update_streak_on_completion(); 