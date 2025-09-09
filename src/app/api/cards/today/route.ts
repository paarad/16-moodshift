import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Demo user ID for testing without auth
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

// Use service role client to bypass RLS
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') as 'zen' | 'warrior' || 'zen';
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's card for the specified mode
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .eq('date', today)
      .eq('mode', mode)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
    }
    
    return NextResponse.json({
      card: card || null,
    });

  } catch (error) {
    console.error('Get today card error:', error);
    return NextResponse.json(
      { error: 'Failed to get today\'s card' },
      { status: 500 }
    );
  }
} 