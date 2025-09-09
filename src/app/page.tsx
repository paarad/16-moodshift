'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyCard } from '@/components/DailyCard';
import { Sparkles, Zap, Heart, Twitter } from 'lucide-react';
import { Card as CardType } from '@/types/database';

type ModeType = 'zen' | 'warrior';

export default function HomePage() {
  const [zenCard, setZenCard] = useState<CardType | null>(null);
  const [warriorCard, setWarriorCard] = useState<CardType | null>(null);
  const [isGeneratingZen, setIsGeneratingZen] = useState(false);
  const [isGeneratingWarrior, setIsGeneratingWarrior] = useState(false);

  // Load existing cards on page load
  useEffect(() => {
    loadExistingCards();
  }, []);

  const loadExistingCards = async () => {
    try {
      // Load zen card
      const zenResponse = await fetch('/api/cards/today?mode=zen');
      const zenData = await zenResponse.json();
      if (zenData.card) {
        setZenCard(zenData.card);
      }

      // Load warrior card
      const warriorResponse = await fetch('/api/cards/today?mode=warrior');
      const warriorData = await warriorResponse.json();
      if (warriorData.card) {
        setWarriorCard(warriorData.card);
      }
    } catch (error) {
      console.error('Failed to load existing cards:', error);
    }
  };

  const generateCard = async (mode: ModeType) => {
    if (mode === 'zen') {
      setIsGeneratingZen(true);
    } else {
      setIsGeneratingWarrior(true);
    }
    
    try {
      const response = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json();
      
      if (response.ok || (response.status === 409 && data.card)) {
        // Either new card generated or existing card found
        if (mode === 'zen') {
          setZenCard(data.card);
        } else {
          setWarriorCard(data.card);
        }
      } else {
        alert(data.error || 'Failed to generate card');
      }
    } catch (error) {
      console.error('Failed to generate card:', error);
      alert('Failed to generate card');
    } finally {
      if (mode === 'zen') {
        setIsGeneratingZen(false);
      } else {
        setIsGeneratingWarrior(false);
      }
    }
  };

  const shareOnTwitter = (card: CardType) => {
    const text = `"${card.quote_text}" - ${card.quote_author}\n\nGenerated with MoodShift ${card.mode === 'zen' ? '🧘' : '⚔️'}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const completeAction = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Update the correct card state
        if (data.card.mode === 'zen') {
          setZenCard(data.card);
        } else {
          setWarriorCard(data.card);
        }
      }
    } catch (error) {
      console.error('Failed to complete action:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">MoodShift</h1>
              <p className="text-sm text-slate-600">Pick your energy. Shift your mood.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Choose Your Energy</h2>
          <p className="text-slate-600">Select the mode that matches your vibe today</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Zen Card Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">🧘 Zen Mode</h3>
              <p className="text-slate-600 text-sm">Calm & peaceful</p>
            </div>
            
            {zenCard ? (
              <div className="space-y-4">
                <DailyCard
                  card={zenCard}
                  onComplete={completeAction}
                  isLoading={false}
                />
                <div className="flex justify-center">
                  <Button
                    onClick={() => shareOnTwitter(zenCard)}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Twitter className="w-4 h-4" />
                    Share on Twitter
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <CardContent className="text-center">
                  <Button
                    onClick={() => generateCard('zen')}
                    disabled={isGeneratingZen}
                    className="h-16 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-4 px-8"
                  >
                    <Heart className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium text-lg">Generate Zen Card</div>
                      <div className="text-sm opacity-90">Calm & peaceful</div>
                    </div>
                    {isGeneratingZen && (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Warrior Card Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-orange-600 mb-2">⚔️ Warrior Mode</h3>
              <p className="text-slate-600 text-sm">Bold & energetic</p>
            </div>
            
            {warriorCard ? (
              <div className="space-y-4">
                <DailyCard
                  card={warriorCard}
                  onComplete={completeAction}
                  isLoading={false}
                />
                <div className="flex justify-center">
                  <Button
                    onClick={() => shareOnTwitter(warriorCard)}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Twitter className="w-4 h-4" />
                    Share on Twitter
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="h-64 flex items-center justify-center">
                <CardContent className="text-center">
                  <Button
                    onClick={() => generateCard('warrior')}
                    disabled={isGeneratingWarrior}
                    className="h-16 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-4 px-8"
                  >
                    <Zap className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-medium text-lg">Generate Warrior Card</div>
                      <div className="text-sm opacity-90">Bold & energetic</div>
                    </div>
                    {isGeneratingWarrior && (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
