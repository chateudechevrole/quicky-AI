# QuickTutor MVP

A simple MVP web app for instant tutoring (like Preply + Grab).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new Supabase project
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase URL and anon key

3. Run database migrations:
   - Go to Supabase SQL Editor
   - Run `supabase/schema.sql` to create all tables
   - Run `supabase/rls.sql` to set up RLS policies

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database + RLS)

