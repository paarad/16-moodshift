export type MoodMode = 'zen' | 'warrior';
export type AudienceType = 'woman' | 'man' | 'non_binary' | 'prefer_not_to_say' | 'custom';
export type ToneType = 'soft' | 'balanced' | 'strong';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  mode: MoodMode;
  audience: AudienceType;
  tone: ToneType;
  delivery_time: string;
  timezone: string;
  themes: string[];
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  date: string;
  quote_text: string;
  quote_author: string | null;
  reflection: string;
  action: string;
  mantra: string;
  mode: MoodMode;
  audience_used: AudienceType | null;
  themes: string[];
  completed: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  updated_at: string;
}

export interface Telemetry {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export interface GenerationQuota {
  id: string;
  user_id: string;
  date: string;
  generations_used: number;
  max_generations: number;
  created_at: string;
}

// AI Generation types
export interface CardGenerationInput {
  mode: MoodMode;
  themes: string[];
  language: string;
  tone: ToneType;
  audience: AudienceType;
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
  mode: MoodMode;
  audience_used: AudienceType;
}

// Supabase Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Settings, 'id' | 'user_id' | 'created_at'>>;
      };
      cards: {
        Row: Card;
        Insert: Omit<Card, 'id' | 'created_at'>;
        Update: Partial<Omit<Card, 'id' | 'user_id' | 'created_at'>>;
      };
      streaks: {
        Row: Streak;
        Insert: Omit<Streak, 'id' | 'updated_at'>;
        Update: Partial<Omit<Streak, 'id' | 'user_id'>>;
      };
      telemetry: {
        Row: Telemetry;
        Insert: Omit<Telemetry, 'id' | 'created_at'>;
        Update: never;
      };
      generation_quotas: {
        Row: GenerationQuota;
        Insert: Omit<GenerationQuota, 'id' | 'created_at'>;
        Update: Partial<Omit<GenerationQuota, 'id' | 'user_id' | 'date' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      mood_mode: MoodMode;
      audience_type: AudienceType;
      tone_type: ToneType;
    };
  };
} 