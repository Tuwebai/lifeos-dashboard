import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpjkdvmejoguqddinlyc.supabase.co';
const supabaseAnonKey = 'sb_publishable_t931yILJI6xQ67cxEqRx1Q_nHXdS7CV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
