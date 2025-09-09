import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface CardGenerationInput {
  mode: 'zen' | 'warrior';
  themes: string[];
  language: string;
  tone: 'soft' | 'balanced' | 'strong';
  audience: 'woman' | 'man' | 'non_binary' | 'prefer_not_to_say' | 'custom';
  streak: number;
}

export interface CardGenerationOutput {
  quote: {
    text: string;
    author: string;
  };
  reflection: string;
  action: string;
  mantra: string;
  mode: 'zen' | 'warrior';
  audience_used: string;
}

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
- ZEN: Calm, peaceful, mindful, introspective
- WARRIOR: Bold, energetic, confident, action-oriented

THEMES: ${themes.join(', ')}

TONE: ${tone}
AUDIENCE: ${audience}
LANGUAGE: ${language}
STREAK: ${streak} days

Generate a complete card with quote, reflection, action, and mantra.`;

  const userPrompt = `Generate a ${mode} mode card for someone on a ${streak}-day streak.`;

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

    // Parse the AI response
    const lines = content.split('\n').filter(line => line.trim());
    
    let quoteText = '';
    let quoteAuthor = 'Unknown';
    let reflection = '';
    let action = '';
    let mantra = '';

    let currentSection = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      
      if (lowerLine.includes('quote:') || lowerLine.includes('"')) {
        currentSection = 'quote';
        const quoteMatch = line.match(/"([^"]+)"/);
        if (quoteMatch) {
          quoteText = quoteMatch[1];
        }
        // Look for author after quote
        const authorMatch = line.match(/—\s*(.+)$/) || line.match(/-\s*(.+)$/);
        if (authorMatch) {
          quoteAuthor = authorMatch[1].trim();
        }
      } else if (lowerLine.includes('reflection:')) {
        currentSection = 'reflection';
        reflection = line.replace(/reflection:\s*/i, '').trim();
      } else if (lowerLine.includes('action:')) {
        currentSection = 'action';
        action = line.replace(/action:\s*/i, '').trim();
      } else if (lowerLine.includes('mantra:')) {
        currentSection = 'mantra';
        mantra = line.replace(/mantra:\s*/i, '').trim();
      } else if (currentSection === 'reflection' && reflection) {
        reflection += ' ' + line.trim();
      } else if (currentSection === 'action' && action) {
        action += ' ' + line.trim();
      } else if (currentSection === 'mantra' && mantra) {
        mantra += ' ' + line.trim();
      }
    }

    // Fallback parsing if structured format fails
    if (!quoteText && lines.length > 0) {
      const firstLine = lines[0];
      const quoteMatch = firstLine.match(/"([^"]+)"/);
      if (quoteMatch) {
        quoteText = quoteMatch[1];
        quoteAuthor = firstLine.match(/—\s*(.+)$/)?.[1]?.trim() || 'Unknown';
      } else {
        quoteText = firstLine;
      }
    }

    if (!reflection && lines.length > 1) {
      reflection = lines[1];
    }
    if (!action && lines.length > 2) {
      action = lines[2];
    }
    if (!mantra && lines.length > 3) {
      mantra = lines[3];
    }

    // Ensure we have all required fields
    if (!quoteText) quoteText = mode === 'zen' ? 'Peace begins with a smile.' : 'Success is not final, failure is not fatal.';
    if (!reflection) reflection = mode === 'zen' ? 'Take a moment to breathe deeply and center yourself.' : 'You have the strength to overcome any challenge.';
    if (!action) action = mode === 'zen' ? 'Take 5 deep breaths right now.' : 'Stand tall and say "I am capable" out loud.';
    if (!mantra) mantra = mode === 'zen' ? 'I am peaceful.' : 'I am strong.';

    return {
      quote: {
        text: quoteText,
        author: quoteAuthor
      },
      reflection,
      action,
      mantra,
      mode,
      audience_used: audience
    };

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback content
    const fallbackContent = {
      zen: {
        quote: { text: 'Peace begins with a smile.', author: 'Mother Teresa' },
        reflection: 'Take a moment to breathe deeply and center yourself. Find peace in the present moment.',
        action: 'Take 5 deep breaths right now.',
        mantra: 'I am peaceful.'
      },
      warrior: {
        quote: { text: 'Success is not final, failure is not fatal.', author: 'Winston Churchill' },
        reflection: 'You have the strength to overcome any challenge. Believe in your power.',
        action: 'Stand tall and say "I am capable" out loud.',
        mantra: 'I am strong.'
      }
    };

    return {
      ...fallbackContent[mode],
      mode,
      audience_used: audience
    };
  }
}
