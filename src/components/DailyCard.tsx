'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Quote, CheckCircle2, Sparkles, Copy, Share } from 'lucide-react';
import { Card as CardType } from '@/types/database';
import { cn } from '@/lib/utils';

interface DailyCardProps {
  card: CardType;
  onComplete?: (cardId: string) => Promise<void>;
  onShare?: (card: CardType) => void;
  isLoading?: boolean;
  className?: string;
}

export function DailyCard({ 
  card, 
  onComplete, 
  onShare, 
  isLoading = false,
  className 
}: DailyCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleComplete = async () => {
    if (!onComplete || card.completed) return;
    
    setIsCompleting(true);
    try {
      await onComplete(card.id);
    } catch (error) {
      console.error('Failed to complete action:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCopy = async () => {
    const text = `${card.quote_text} - ${card.quote_author}

${card.reflection}

Action: ${card.action}
Mantra: ${card.mantra}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const modeColors = {
    zen: {
      bg: 'bg-gradient-to-br from-slate-50 to-blue-50',
      border: 'border-blue-100',
      badge: 'bg-blue-100 text-blue-700',
      quote: 'text-blue-800',
      text: 'text-slate-700',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    warrior: {
      bg: 'bg-gradient-to-br from-slate-50 to-orange-50',
      border: 'border-orange-100',
      badge: 'bg-orange-100 text-orange-700',
      quote: 'text-orange-800',
      text: 'text-slate-700',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
  };

  const colors = modeColors[card.mode];

  return (
    <Card className={cn(
      'w-full max-w-lg mx-auto transition-all duration-300 hover:shadow-lg',
      colors.bg,
      colors.border,
      isLoading && 'animate-pulse',
      className
    )}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={colors.badge}>
            <Sparkles className="w-3 h-3 mr-1" />
            {card.mode === 'zen' ? 'Zen' : 'Warrior'}
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
            >
              <Copy className={cn("w-4 h-4", copied && "text-green-600")} />
            </Button>
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(card)}
                className="h-8 w-8 p-0"
              >
                <Share className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quote */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Quote className={cn("w-5 h-5 mt-1 flex-shrink-0", colors.quote)} />
            <blockquote className={cn("text-lg font-medium leading-relaxed", colors.quote)}>
              {card.quote_text}
            </blockquote>
          </div>
          {card.quote_author && (
            <p className="text-sm text-slate-500 text-right">
              — {card.quote_author}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Reflection */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800">Reflection</h3>
          <p className={cn("leading-relaxed", colors.text)}>
            {card.reflection}
          </p>
        </div>

        {/* Action */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800">60-Second Action</h3>
          <div className={cn(
            "p-4 rounded-lg border-l-4",
            card.mode === 'zen' ? 'bg-blue-25 border-blue-300' : 'bg-orange-25 border-orange-300'
          )}>
            <p className={cn("font-medium", colors.text)}>
              {card.action}
            </p>
          </div>
          
          {!card.completed && onComplete && (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className={cn("w-full", colors.button)}
            >
              {isCompleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Done
                </>
              )}
            </Button>
          )}

          {card.completed && (
            <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">Action completed!</span>
            </div>
          )}
        </div>

        {/* Mantra */}
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800">Mantra</h3>
          <div className="text-center p-4 bg-white/60 rounded-lg">
            <p className={cn("text-lg font-medium italic", colors.quote)}>
              "{card.mantra}"
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center text-xs text-slate-500">
        <div className="flex gap-2">
          {card.themes.map((theme) => (
            <span
              key={theme}
              className="px-2 py-1 bg-white/60 rounded-full"
            >
              {theme}
            </span>
          ))}
        </div>
        <time>{new Date(card.date).toLocaleDateString()}</time>
      </CardFooter>
    </Card>
  );
} 