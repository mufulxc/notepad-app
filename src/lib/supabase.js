import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wjrsfmaniumwjrrgljpb.supabase.co'
const supabaseAnonKey = 'sb_publishable_g70Ev46QVm96a8NSBxId_w_nSl0eHcc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
