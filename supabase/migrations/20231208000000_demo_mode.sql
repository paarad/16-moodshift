-- Temporarily disable RLS for demo mode
alter table profiles disable row level security;
alter table cards disable row level security;

-- Create a demo user profile if it doesn't exist
insert into profiles (id, email) 
values ('00000000-0000-0000-0000-000000000000', 'demo@moodshift.app')
on conflict (id) do nothing;

-- Create demo user settings
insert into settings (user_id, mode, themes) 
values ('00000000-0000-0000-0000-000000000000', 'zen', ARRAY['focus', 'creativity'])
on conflict (user_id) do nothing; 