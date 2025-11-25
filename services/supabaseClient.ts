import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keys provided by user
const SUPABASE_URL = 'https://jlfafyjqesvxkqhxwhan.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZmFmeWpxZXN2eGtxaHh3aGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTM2MjIsImV4cCI6MjA3OTYyOTYyMn0.FSdClUfj_marGCHrZxcFQW8y8LzdVsbtAIvaDMEJMZk';

let client: SupabaseClient;

try {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  console.error("Supabase Client Initialization Error:", error);
  client = {} as SupabaseClient;
}

export const supabase = client;

export const isSupabaseConfigured = () => {
  return true; // Hardcoded keys are present
};
