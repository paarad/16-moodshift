import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCard } from '@/lib/ai';
import { Database } from '@/types/database';

// Demo user ID for testing without auth
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

// Use service role client to bypass RLS
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode = 'zen' } = body;
    
    // Validate mode
    if (mode !== 'zen' && mode !== 'warrior') {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have a card for this mode today
    const { data: existingCard } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .eq('date', today)
      .eq('mode', mode)
      .single();

    if (existingCard) {
      return NextResponse.json({ 
        error: 'Card already generated for today',
        card: existingCard 
      }, { status: 409 });
    }

    // Generate the card using AI with selected mode
    const cardInput = {
      mode: mode as 'zen' | 'warrior',
      themes: mode === 'zen' ? ['mindfulness', 'peace'] : ['strength', 'motivation'],
      language: 'en',
      tone: (mode === 'zen' ? 'soft' : 'strong') as 'soft' | 'balanced' | 'strong',
      audience: 'prefer_not_to_say' as const,
      streak: 0,
    };

    const generatedCard = await generateCard(cardInput);

    // Save the card to Supabase
    const { data: savedCard, error } = await supabase
      .from('cards')
      .insert({
        user_id: DEMO_USER_ID,
        date: today,
        quote_text: generatedCard.quote.text,
        quote_author: generatedCard.quote.author,
        reflection: generatedCard.reflection,
        action: generatedCard.action,
        mantra: generatedCard.mantra,
        mode: generatedCard.mode,
        audience_used: generatedCard.audience_used,
        themes: cardInput.themes,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save card' }, { status: 500 });
    }

    return NextResponse.json({ 
      card: savedCard
    });

  } catch (error) {
    console.error('Card generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card' },
      { status: 500 }
    );
  }
} 