import OpenAI from 'openai';
import { CardGenerationInput, CardGenerationOutput } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateCard(input: CardGenerationInput): Promise<CardGenerationOutput> {
  const { mode, themes, language, tone, audience, streak } = input;

  const systemPrompt = `You are MoodShift, an AI that generates daily inspiration cards. Your role is to create personalized, actionable content that helps users shift their mindset and energy.

RULES:
- Quote: ≤160 characters, real or AI-inspired
- Reflection: ≤500 characters, 3-5 lines
- Action: ≤140 characters, doable in ≤60 seconds, no equipment needed
- Mantra: ≤60 characters, matches the mode
- If quote author is unknown, return "Unknown"

MODES:
- Zen: Calm, mindful, restorative energy. Actions focus on breath, posture, awareness, tiny check-ins. Mantras like "Inhale. Soften. Focus."
- Warrior: Focused, decisive, resilient energy. Actions focus on sprint, commit, send, push. Mantras like "One clean rep."

TONE ADJUSTMENTS:
- Soft: Gentle, nurturing language
- Balanced: Clear, supportive language  
- Strong: Direct, motivating language

AUDIENCE: Light adjustments in tone or pronouns for ${audience}, but no stereotypes or assumptions.

THEMES: Focus on ${themes.join(', ')}
STREAK: User is on a ${streak}-day streak - acknowledge their progress subtly.`;

  const userPrompt = `Generate a ${mode} mode card in ${language} with ${tone} tone for themes: ${themes.join(', ')}.

Return ONLY valid JSON in this exact format:
{
  "quote": {
    "text": "...",
    "author": "..."
  },
  "reflection": "...",
  "action": "...",
  "mantra": "...",
  "mode": "${mode}",
  "audience_used": "${audience}"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    const result = JSON.parse(content) as CardGenerationOutput;
    
    // Validate the response structure
    if (!result.quote?.text || !result.reflection || !result.action || !result.mantra) {
      throw new Error('Invalid response structure');
    }

    // Validate character limits
    if (result.quote.text.length > 160) {
      throw new Error('Quote too long');
    }
    if (result.reflection.length > 500) {
      throw new Error('Reflection too long');
    }
    if (result.action.length > 140) {
      throw new Error('Action too long');
    }
    if (result.mantra.length > 60) {
      throw new Error('Mantra too long');
    }

    return result;
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback response
    return {
      quote: {
        text: mode === 'zen' ? 'Peace comes from within. Do not seek it without.' : 'Victory belongs to the most persevering.',
        author: mode === 'zen' ? 'Buddha' : 'Napoleon Bonaparte'
      },
      reflection: mode === 'zen' 
        ? 'Today is a chance to pause, breathe, and reconnect with your inner calm. Every moment offers an opportunity to find peace.'
        : 'Today is your arena. Every challenge is a chance to grow stronger. Step forward with purpose and determination.',
      action: mode === 'zen' 
        ? 'Take 3 deep breaths. Feel your shoulders relax with each exhale.'
        : 'Write down one goal for today. Take the first action step right now.',
      mantra: mode === 'zen' ? 'Breathe. Be present. Be peace.' : 'I am strong. I am focused. I act.',
      mode,
      audience_used: audience
    };
  }
}

export async function validateApiKey(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch {
    return false;
  }
} 