import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pqpdofgozfbivivsyvlq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcGRvZmdvemZiaXZpdnN5dmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTc3MzEsImV4cCI6MjA4OTE5MzczMX0.jhAESWDb2b9h7WzeQsKoltmwKbCHsyVjoVGLtvtWXSY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'outfitr-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Initialize database tables (run once)
export async function initializeDatabase() {
  // Create tables via Supabase SQL if they don't exist
  // Note: Tables should be created in Supabase dashboard or via migrations
  // This function creates the storage bucket
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'clothing-photos')
  if (!exists) {
    await supabase.storage.createBucket('clothing-photos', { public: true })
  }
}
