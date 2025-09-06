# MoodShift

Pick your energy. Shift your mood. One card a day.

MoodShift delivers a daily inspiration card — a quote, a short reflection, and a 60‑second action — tailored to your mindset: Zen or Warrior.

## Features

- **Daily Cards**: AI-generated inspiration cards with quote, reflection, action, and mantra
- **Two Modes**: Choose between Zen (calm, mindful) or Warrior (focused, decisive) energy
- **Personalization**: Customizable themes, tone, delivery time, and audience preferences
- **Streak Tracking**: Monitor your consistency with streak counters and badges
- **History**: View and share past cards
- **Mobile-First**: Responsive PWA-ready design with shadcn/ui

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Real-time)
- **AI**: OpenAI GPT-4o-mini for card generation
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/paarad/16-moodshift.git
   cd 16-moodshift
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `OPENAI_API_KEY`: Your OpenAI API key

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL editor
   - Enable Row Level Security on all tables

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
│   ├── supabase.ts     # Supabase client configuration
│   ├── auth.ts         # Authentication utilities
│   └── ai.ts           # OpenAI integration
└── types/              # TypeScript type definitions
    └── database.ts     # Database and API types

supabase/
└── schema.sql          # Database schema and RLS policies
```

## Database Schema

- **profiles**: User profiles extending auth.users
- **settings**: User preferences (mode, themes, delivery time, etc.)
- **cards**: Generated daily inspiration cards
- **streaks**: User streak tracking
- **telemetry**: Event logging for analytics
- **generation_quotas**: Rate limiting for AI generations

## API Routes

- `POST /api/cards/generate` - Generate a new card
- `GET /api/cards/today` - Get today's card
- `POST /api/cards/:id/complete` - Mark card action as completed
- `POST /api/cards/:id/share` - Share card functionality
- `POST /api/settings/update` - Update user settings
- `POST /api/cron/daily` - Daily card generation (cron job)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
