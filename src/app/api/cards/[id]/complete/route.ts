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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const cardId = params.id;

    // Update the card as completed
    const { data: updatedCard, error } = await supabase
      .from('cards')
      .update({ completed: true })
      .eq('id', cardId)
      .eq('user_id', DEMO_USER_ID)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({
      card: updatedCard,
    });

  } catch (error) {
    console.error('Complete card error:', error);
    return NextResponse.json(
      { error: 'Failed to complete card' },
      { status: 500 }
    );
  }
}
