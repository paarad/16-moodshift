import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateCard } from '@/lib/ai';
import { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { regenerate = false } = body;
    
    const today = new Date().toISOString().split('T')[0];

    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    // Get current streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single();

    // Check generation quota
    const { data: quota } = await supabase
      .from('generation_quotas')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const currentGenerations = quota?.generations_used || 0;
    const maxGenerations = quota?.max_generations || 2;

    if (currentGenerations >= maxGenerations) {
      return NextResponse.json({ 
        error: 'Daily generation limit reached',
        quota: { used: currentGenerations, max: maxGenerations }
      }, { status: 429 });
    }

    // Check if card already exists for today
    const { data: existingCard } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existingCard && !regenerate) {
      return NextResponse.json({ 
        error: 'Card already exists for today',
        card: existingCard 
      }, { status: 409 });
    }

    // Generate the card using AI
    const cardInput = {
      mode: settings.mode,
      themes: settings.themes,
      language: settings.language,
      tone: settings.tone,
      audience: settings.audience,
      streak: streak?.current_streak || 0,
    };

    const generatedCard = await generateCard(cardInput);

    // Save or update the card
    const cardData = {
      user_id: user.id,
      date: today,
      quote_text: generatedCard.quote.text,
      quote_author: generatedCard.quote.author,
      reflection: generatedCard.reflection,
      action: generatedCard.action,
      mantra: generatedCard.mantra,
      mode: generatedCard.mode,
      audience_used: generatedCard.audience_used,
      themes: settings.themes,
      completed: false,
    };

    let savedCard;
    if (existingCard) {
      // Update existing card
      const { data, error } = await supabase
        .from('cards')
        .update(cardData)
        .eq('id', existingCard.id)
        .select()
        .single();
      
      if (error) throw error;
      savedCard = data;
    } else {
      // Insert new card
      const { data, error } = await supabase
        .from('cards')
        .insert(cardData)
        .select()
        .single();
      
      if (error) throw error;
      savedCard = data;
    }

    // Update generation quota
    if (quota) {
      await supabase
        .from('generation_quotas')
        .update({ generations_used: currentGenerations + 1 })
        .eq('id', quota.id);
    } else {
      await supabase
        .from('generation_quotas')
        .insert({
          user_id: user.id,
          date: today,
          generations_used: 1,
          max_generations: 2,
        });
    }

    // Log telemetry
    await supabase
      .from('telemetry')
      .insert({
        user_id: user.id,
        event_type: regenerate ? 'card_regenerated' : 'card_generated',
        event_data: { 
          card_id: savedCard.id,
          mode: settings.mode,
          themes: settings.themes 
        },
      });

    return NextResponse.json({ 
      card: savedCard,
      quota: { used: currentGenerations + 1, max: maxGenerations }
    });

  } catch (error) {
    console.error('Card generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card' },
      { status: 500 }
    );
  }
} 