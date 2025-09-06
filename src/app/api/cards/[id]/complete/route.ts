import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cardId = params.id;

    // Verify the card belongs to the user
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Mark the card as completed
    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({ completed: true })
      .eq('id', cardId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log telemetry
    await supabase
      .from('telemetry')
      .insert({
        user_id: user.id,
        event_type: 'action_completed',
        event_data: { 
          card_id: cardId,
          mode: card.mode,
          action: card.action,
        },
      });

    // Get updated streak info (triggered by database function)
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      card: updatedCard,
      streak: {
        current: streak?.current_streak || 0,
        longest: streak?.longest_streak || 0,
        lastCompletion: streak?.last_completion_date || null,
      },
    });

  } catch (error) {
    console.error('Complete card error:', error);
    return NextResponse.json(
      { error: 'Failed to complete card' },
      { status: 500 }
    );
  }
} 