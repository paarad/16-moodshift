'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DailyCard } from '@/components/DailyCard';
import { Sparkles, Flame, Mail, RefreshCw, Settings } from 'lucide-react';
import { Card as CardType, Settings as SettingsType } from '@/types/database';
import { cn } from '@/lib/utils';

interface TodayData {
  card: CardType | null;
  quota: { used: number; max: number };
  streak: { current: number; longest: number; lastCompletion: string | null };
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (user) {
        await Promise.all([
          fetchTodayData(),
          fetchSettings()
        ]);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await Promise.all([
            fetchTodayData(),
            fetchSettings()
          ]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/cards/today');
      if (response.ok) {
        const data = await response.json();
        setTodayData(data);
      }
    } catch (error) {
      console.error('Failed to fetch today data:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Sign in error:', error);
      } else {
        alert('Check your email for the login link!');
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTodayData(null);
    setSettings(null);
  };

  const generateCard = async (regenerate = false) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodayData(prev => prev ? {
          ...prev,
          card: data.card,
          quota: data.quota
        } : null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate card');
      }
    } catch (error) {
      console.error('Failed to generate card:', error);
      alert('Failed to generate card');
    } finally {
      setIsGenerating(false);
    }
  };

  const completeAction = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setTodayData(prev => prev ? {
          ...prev,
          card: data.card,
          streak: data.streak
        } : null);
      }
    } catch (error) {
      console.error('Failed to complete action:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">MoodShift</CardTitle>
              <p className="text-slate-600 mt-2">
                Pick your energy. Shift your mood. One card a day.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Sign in with magic link
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-slate-500 text-center mt-4">
              We'll send you a secure login link via email
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">MoodShift</h1>
              <p className="text-sm text-slate-600">
                {settings?.mode === 'zen' ? '🧘 Zen Mode' : '⚔️ Warrior Mode'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {todayData?.streak && (
              <Badge variant="secondary" className="gap-1">
                <Flame className="w-3 h-3" />
                {todayData.streak.current} day streak
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats */}
          {todayData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-slate-600">Current Streak</p>
                      <p className="text-2xl font-bold">{todayData.streak.current}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-slate-600">Best Streak</p>
                      <p className="text-2xl font-bold">{todayData.streak.longest}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">Daily Generations</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(todayData.quota.used / todayData.quota.max) * 100} 
                        className="flex-1" 
                      />
                      <span className="text-sm font-medium">
                        {todayData.quota.used}/{todayData.quota.max}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Today's Card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Today's Card</h2>
              <div className="flex gap-2">
                {todayData?.card && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateCard(true)}
                    disabled={isGenerating || todayData.quota.used >= todayData.quota.max}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                    Regenerate
                  </Button>
                )}
                {!todayData?.card && (
                  <Button
                    onClick={() => generateCard(false)}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Today's Card
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {todayData?.card ? (
              <DailyCard
                card={todayData.card}
                onComplete={completeAction}
                isLoading={isGenerating}
              />
            ) : (
              <Card className="w-full max-w-lg mx-auto">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Ready for today's inspiration?</h3>
                    <p className="text-slate-600 mt-1">
                      Generate your personalized {settings?.mode} card to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
