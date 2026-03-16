#!/usr/bin/env node
/**
 * Outfitr DB Setup — creates all Supabase tables and storage bucket
 * Uses Supabase Management API (requires personal access token)
 */

const PROJECT_REF = 'pqpdofgozfbivivsyvlq'
const SUPABASE_URL = 'https://pqpdofgozfbivivsyvlq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcGRvZmdvemZiaXZpdnN5dmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTc3MzEsImV4cCI6MjA4OTE5MzczMX0.jhAESWDb2b9h7WzeQsKoltmwKbCHsyVjoVGLtvtWXSY'

const PAT = process.argv[2]

if (!PAT) {
  console.error('Usage: node setup-db.mjs <your-personal-access-token>')
  console.error('Get your token at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || JSON.stringify(data))
  }
  return data
}

async function createStorageBucket() {
  // Create bucket via Supabase Storage API
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'clothing-photos', name: 'clothing-photos', public: true }),
  })
  const data = await res.json()
  if (res.ok) {
    console.log('✓ Storage bucket "clothing-photos" created (public)')
  } else if (data.error === 'Duplicate' || data.message?.includes('already exists')) {
    console.log('✓ Storage bucket "clothing-photos" already exists')
  } else {
    console.warn('  Storage bucket note:', data.message || JSON.stringify(data))
  }
}

const tables = [
  {
    name: 'clothes',
    sql: `
      CREATE TABLE IF NOT EXISTS clothes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        category text,
        color text,
        season text DEFAULT 'All',
        occasion text DEFAULT 'Everyday',
        photo_url text,
        times_worn integer DEFAULT 0,
        last_worn date,
        created_at timestamptz DEFAULT now()
      );
    `,
  },
  {
    name: 'outfit_history',
    sql: `
      CREATE TABLE IF NOT EXISTS outfit_history (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        date date NOT NULL,
        weather_temp integer,
        weather_condition text,
        mood text,
        outfit_items jsonb DEFAULT '[]'::jsonb,
        created_at timestamptz DEFAULT now()
      );
    `,
  },
  {
    name: 'wishlist',
    sql: `
      CREATE TABLE IF NOT EXISTS wishlist (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        item text NOT NULL,
        reason text,
        priority text DEFAULT 'Medium',
        added_date date DEFAULT CURRENT_DATE,
        created_at timestamptz DEFAULT now()
      );
    `,
  },
  {
    name: 'outfit_feedback',
    sql: `
      CREATE TABLE IF NOT EXISTS outfit_feedback (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        outfit_items jsonb DEFAULT '[]'::jsonb,
        mood text,
        weather_tier text,
        liked boolean,
        tags text[] DEFAULT '{}',
        notes text,
        created_at timestamptz DEFAULT now()
      );
    `,
  },
  {
    name: 'item_scores',
    sql: `
      CREATE TABLE IF NOT EXISTS item_scores (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        item_id text NOT NULL UNIQUE,
        score integer DEFAULT 0,
        updated_at timestamptz DEFAULT now()
      );
    `,
  },
]

// Enable RLS and add permissive policies so the anon key can read/write
const rlsPolicies = `
  -- Enable RLS on all tables
  ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;
  ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
  ALTER TABLE outfit_feedback ENABLE ROW LEVEL SECURITY;
  ALTER TABLE item_scores ENABLE ROW LEVEL SECURITY;

  -- Allow all operations for anon (single-user app, no auth)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clothes' AND policyname = 'allow_all_clothes') THEN
      CREATE POLICY allow_all_clothes ON clothes FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_history' AND policyname = 'allow_all_outfit_history') THEN
      CREATE POLICY allow_all_outfit_history ON outfit_history FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlist' AND policyname = 'allow_all_wishlist') THEN
      CREATE POLICY allow_all_wishlist ON wishlist FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_feedback' AND policyname = 'allow_all_outfit_feedback') THEN
      CREATE POLICY allow_all_outfit_feedback ON outfit_feedback FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'item_scores' AND policyname = 'allow_all_item_scores') THEN
      CREATE POLICY allow_all_item_scores ON item_scores FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
  END$$;
`

async function main() {
  console.log('🗄  Setting up Outfitr database...\n')

  for (const table of tables) {
    try {
      await runSQL(table.sql)
      console.log(`✓ Table "${table.name}" ready`)
    } catch (err) {
      console.error(`✗ Failed to create "${table.name}":`, err.message)
      process.exit(1)
    }
  }

  try {
    await runSQL(rlsPolicies)
    console.log('✓ Row-level security policies applied')
  } catch (err) {
    console.warn('  RLS note:', err.message)
  }

  await createStorageBucket()

  console.log('\n✅ Database setup complete! All tables and storage are ready.')
  console.log('   You can now use the app at http://localhost:5173')
}

main()
