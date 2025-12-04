# Vercel Deployment Guide

## Environment Variables Required

You need to set these in Vercel Dashboard after deployment:

1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key
3. **GOOGLE_API_KEY** - Your Google Gemini API key

## Deployment Steps

### Option 1: Using Vercel CLI (Current Method)
1. Run `vercel` command (will prompt for login if needed)
2. Follow the prompts to link your project
3. After deployment, add environment variables in Vercel Dashboard

### Option 2: Using Vercel Web Interface (Recommended)
1. Go to https://vercel.com/new
2. Import your GitHub repository: `chateudechevrole/quicky-AI`
3. Vercel will auto-detect Next.js
4. Add environment variables in the project settings
5. Deploy!

## After Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all 3 environment variables
4. Redeploy to apply changes


