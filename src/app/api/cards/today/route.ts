import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's card
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (cardError && cardError.code !== 'PGRST116') {
      throw cardError;
    }

    // Get generation quota info
    const { data: quota } = await supabase
      .from('generation_quotas')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    // Get streak info
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      card: card || null,
      quota: {
        used: quota?.generations_used || 0,
        max: quota?.max_generations || 2,
      },
      streak: {
        current: streak?.current_streak || 0,
        longest: streak?.longest_streak || 0,
        lastCompletion: streak?.last_completion_date || null,
      },
    });

  } catch (error) {
    console.error('Get today card error:', error);
    return NextResponse.json(
      { error: 'Failed to get today\'s card' },
      { status: 500 }
    );
  }
} 