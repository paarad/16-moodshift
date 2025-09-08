import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        // No settings found, create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            mode: 'zen',
            audience: 'prefer_not_to_say',
            tone: 'balanced',
            delivery_time: '09:00:00',
            timezone: 'UTC',
            themes: ['focus', 'creativity'],
            language: 'en',
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return NextResponse.json({ settings: newSettings });
      }
      throw settingsError;
    }

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mode,
      audience,
      tone,
      delivery_time,
      timezone,
      themes,
      language,
    } = body;

    // Validate required fields
    if (!mode || !tone || !delivery_time || !timezone || !themes || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validModes = ['zen', 'warrior'];
    const validTones = ['soft', 'balanced', 'strong'];
    const validAudiences = ['woman', 'man', 'non_binary', 'prefer_not_to_say', 'custom'];

    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    if (!validTones.includes(tone)) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 });
    }

    if (audience && !validAudiences.includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
    }

    // Update settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('settings')
      .update({
        mode,
        audience: audience || 'prefer_not_to_say',
        tone,
        delivery_time,
        timezone,
        themes,
        language,
      })
      .eq('user_id', user.id)
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
        event_type: 'settings_updated',
        event_data: { 
          mode,
          themes,
          tone,
          language,
        },
      });

    return NextResponse.json({ settings: updatedSettings });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 