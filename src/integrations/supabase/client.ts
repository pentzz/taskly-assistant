// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://usdrsepeczvuxlujhitm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZHJzZXBlY3p2dXhsdWpoaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MDc2MTUsImV4cCI6MjA1Mjk4MzYxNX0.yIXL474F13Mh-zids1btwpnV4ndJic9uIBYZH4k0_G4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);