# Supabase Configuration for QuickTutor

## Fix Signup 400 Error

The 400 error during signup is usually caused by Supabase email confirmation settings. Here's how to fix it:

### Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings** → **Email Auth**
3. Find **"Enable email confirmations"**
4. **Turn OFF** email confirmations
5. Save the settings

This allows users to sign up immediately without email confirmation.

### Option 2: Keep Email Confirmation Enabled

If you want to keep email confirmation enabled:

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL: `http://localhost:3000` (for development)
3. Add redirect URLs: `http://localhost:3000/auth/callback`
4. For production, add your production URL as well

### Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### Email Templates (Optional)

If using email confirmation, you can customize the email templates in:
**Authentication** → **Email Templates**

Make sure the confirmation link points to: `{{ .SiteURL }}/auth/callback?token={{ .TokenHash }}&type=email`

## Other Common Issues

### "Email already registered"
- The user already has an account. They should use the login page instead.

### "Invalid email format"
- Make sure the email is properly formatted (e.g., `user@example.com`)
- Check for any extra spaces or special characters

### RLS Policy Errors
- Make sure you've run both `schema.sql` and `rls.sql` in the Supabase SQL Editor
- Check that RLS is enabled on all tables

## Testing

After configuring:
1. Try signing up with a new email address
2. If email confirmation is enabled, check your email and click the confirmation link
3. If disabled, you should be able to sign up and login immediately

