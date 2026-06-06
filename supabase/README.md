# Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run `supabase/schema.sql`.
3. Add these environment variables locally and in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

The current MVP is single-user and stores all rows with `user_id = 'clarice'`.

When both variables exist, every API route uses Supabase. Local development falls back to SQLite only when they are missing. A Vercel deployment without the variables returns a JSON configuration error instead of using temporary SQLite storage.
