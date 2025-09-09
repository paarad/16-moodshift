import { NextRequest, NextResponse } from 'next/server';

// Demo settings data
const demoSettings = {
  id: 'demo-settings',
  user_id: 'demo-user',
  mode: 'zen',
  audience: 'prefer_not_to_say',
  tone: 'balanced',
  delivery_time: '09:00:00',
  timezone: 'UTC',
  themes: ['focus', 'creativity'],
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function GET() {
  try {
    // Demo mode - return mock settings
    return NextResponse.json({ settings: demoSettings });

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

    // Demo mode - simulate update by returning updated settings
    const updatedSettings = {
      ...demoSettings,
      mode,
      audience: audience || 'prefer_not_to_say',
      tone,
      delivery_time,
      timezone,
      themes,
      language,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ settings: updatedSettings });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 