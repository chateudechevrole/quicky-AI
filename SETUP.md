# QuickTutor Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to Project Settings → API
4. Copy your:
   - Project URL
   - Anon/Public Key

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials and Google API key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_API_KEY=your_google_gemini_api_key
   ```

   **To get a Google API key:**
   1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   2. Sign in with your Google account
   3. Click "Create API Key"
   4. Copy the generated API key
   5. Add it to your `.env.local` file as `GOOGLE_API_KEY`

## Step 4: Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the schema file:
   - Open `supabase/schema.sql`
   - Copy and paste the entire contents into the SQL Editor
   - Click "Run" to execute
4. Run the RLS policies file:
   - Open `supabase/rls.sql`
   - Copy and paste the entire contents into the SQL Editor
   - Click "Run" to execute

## Step 5: Create Your First Admin User

Since admin users cannot sign up through the public signup page, you need to create one manually:

1. Go to Authentication → Users in your Supabase dashboard
2. Click "Add user" → "Create new user"
3. Enter an email and password
4. After creating the user, note the User ID (UUID)
5. Go to SQL Editor and run:
   ```sql
   INSERT INTO profiles (id, email, role, full_name)
   VALUES ('<USER_ID_FROM_STEP_4>', 'admin@example.com', 'admin', 'Admin User');
   ```

## Step 6: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Testing the App

1. **As a Student:**
   - Go to `/signup?role=student`
   - Create an account
   - Complete onboarding
   - Browse online tutors
   - Book a tutor

2. **As a Tutor:**
   - Go to `/signup?role=tutor`
   - Create an account
   - Complete onboarding
   - Toggle online status
   - Accept/reject booking requests

3. **As an Admin:**
   - Go to `/admin/login`
   - Login with your admin account
   - View overview, users, bookings, and reports

## Key Features Implemented

✅ User authentication (Student, Tutor, Admin)
✅ Role-based access control
✅ Tutor online/offline toggle
✅ Booking request flow (request → accept/reject → start → end)
✅ Real-time chat in classroom
✅ Timer for class duration
✅ Rating system (Student→Tutor and Tutor→Student)
✅ Notifications system
✅ Admin dashboard with stats
✅ User management
✅ Booking management
✅ Reports system

## Notes

- Payments are simulated (no actual payment processing)
- Real-time features use Supabase subscriptions
- All data is protected by Row Level Security (RLS)
- The app uses server-side rendering with Next.js 14 App Router

