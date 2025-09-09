'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Quote, CheckCircle2, Sparkles, Copy, Share } from 'lucide-react';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

type CardType = Database['public']['Tables']['cards']['Row'];

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
  const [copied, setCopied] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    if (!onComplete || card.completed) return;
    
    setIsCompleting(true);
    try {
      await onComplete(card.id);
    } catch (error) {
      console.error('Failed to complete card:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCopy = async () => {
    const text = `"${card.quote_text}" - ${card.quote_author}\n\n${card.reflection}\n\nAction: ${card.action}\n\nMantra: ${card.mantra}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(card);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span>Generating your card...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <Badge variant="secondary" className="text-xs">
            {card.mode === 'zen' ? '🧘 Zen' : '⚔️ Warrior'}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          Your Daily Inspiration
        </h3>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quote Section */}
        <div className="text-center space-y-3">
          <Quote className="w-8 h-8 text-slate-400 mx-auto" />
          <blockquote className="text-lg font-medium text-slate-700 italic">
            &ldquo;{card.quote_text}&rdquo;
          </blockquote>
          {card.quote_author && (
            <p className="text-sm text-slate-500">— {card.quote_author}</p>
          )}
        </div>

        {/* Reflection Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-800">Reflection</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {card.reflection}
          </p>
        </div>

        {/* Action Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-800">Today&apos;s Action</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {card.action}
          </p>
        </div>

        {/* Mantra Section */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-800">Mantra</h4>
          <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg">
            {card.mantra}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4">
        {/* Complete Button */}
        {!card.completed && onComplete && (
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isCompleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Completing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Mark as Complete
              </div>
            )}
          </Button>
        )}

        {/* Completed State */}
        {card.completed && (
          <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Completed!</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex-1 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          
          {onShare && (
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 flex items-center gap-2"
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
