import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for bypassing RLS
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function ensureDemoUserExists() {
  try {
    // Check if demo user profile exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', DEMO_USER_ID)
      .single();

    if (!profile) {
      // Create demo user profile
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: DEMO_USER_ID,
          email: 'demo@moodshift.app',
        });

      // Create demo user settings
      await supabaseAdmin
        .from('settings')
        .insert({
          user_id: DEMO_USER_ID,
          mode: 'zen',
          themes: ['focus', 'creativity'],
        });

      console.log('Demo user created successfully');
    }
  } catch (error) {
    console.error('Error ensuring demo user exists:', error);
  }
} 