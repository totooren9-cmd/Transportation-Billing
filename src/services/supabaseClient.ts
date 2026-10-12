import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Project credentials provided for Supabase instance
export const DEFAULT_SUPABASE_URL = 'https://dwpremcqguvpeheynvsk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cHJlbWNxZ3V2cGVoZXludnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Mjg1ODIsImV4cCI6MjEwNzEwNDU4Mn0.mRK4cHOyjjBZ7AedpM9azqE6JoJxVuGBfmVGmIwz0A4';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

const STORAGE_KEYS = {
  URL: 'transport_billing_supabase_url',
  KEY: 'transport_billing_supabase_key',
  AUTO_SYNC: 'transport_billing_supabase_autosync',
};

// Normalize URL (strip trailing /rest/v1 or /rest/v1/)
export function sanitizeSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url.endsWith('/rest/v1')) {
    url = url.replace(/\/rest\/v1$/, '');
  }
  return url || SUPABASE_URL;
}

export function getStoredSupabaseConfig() {
  if (typeof localStorage === 'undefined') {
    return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, autoSync: true };
  }
  const customUrl = localStorage.getItem(STORAGE_KEYS.URL);
  const customKey = localStorage.getItem(STORAGE_KEYS.KEY);
  const autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) !== 'false';

  const url = sanitizeSupabaseUrl(customUrl || SUPABASE_URL);
  const anonKey = (customKey || SUPABASE_ANON_KEY).trim();

  return { url, anonKey, autoSync };
}

/**
 * Singleton Supabase client instance initialized with project credentials
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

let dynamicClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (url === SUPABASE_URL && anonKey === SUPABASE_ANON_KEY) {
    return supabase;
  }
  if (!dynamicClient) {
    dynamicClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return dynamicClient;
}

export function saveSupabaseConfig(url: string, anonKey: string, autoSync: boolean) {
  if (typeof localStorage === 'undefined') return;
  const cleanUrl = sanitizeSupabaseUrl(url);
  localStorage.setItem(STORAGE_KEYS.URL, cleanUrl);
  localStorage.setItem(STORAGE_KEYS.KEY, anonKey.trim());
  localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, String(autoSync));
  dynamicClient = null;
}

export function resetSupabaseConfig() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.URL);
  localStorage.removeItem(STORAGE_KEYS.KEY);
  localStorage.removeItem(STORAGE_KEYS.AUTO_SYNC);
  dynamicClient = null;
}

/**
 * Test connectivity with Supabase by probing required tables
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tablesFound?: string[];
  missingTables?: string[];
}> {
  const client = getSupabase();
  const requiredTables = [
    'transport_trips',
    'transport_diesel_prices',
    'transport_rate_cards',
    'transport_zone_mappings',
    'transport_quotations',
    'transport_fixed_customers',
  ];

  try {
    const missing: string[] = [];
    const found: string[] = [];

    for (const table of requiredTables) {
      const { error } = await client.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation')
        ) {
          missing.push(table);
        } else {
          missing.push(table);
        }
      } else {
        found.push(table);
      }
    }

    if (found.length === requiredTables.length) {
      return {
        success: true,
        message: 'เชื่อมต่อ Supabase สำเร็จ และพบตารางครบทุกตาราง (6/6 ตาราง)',
        tablesFound: found,
        missingTables: [],
      };
    } else if (found.length > 0) {
      return {
        success: true,
        message: `เชื่อมต่อ Supabase สำเร็จ แต่พบตารางเพียง ${found.length}/${requiredTables.length} ตาราง กรุณารัน SQL Script`,
        tablesFound: found,
        missingTables: missing,
      };
    } else {
      const { error } = await client.from('transport_trips').select('id').limit(1);
      if (error && error.code === '42P01') {
        return {
          success: true,
          message:
            'เชื่อมต่อกับ Supabase ได้สำเร็จ (Auth & API Key ถูกต้อง) แต่ยังไม่ได้สร้างตารางใน Database กรุณาก๊อปปี้ SQL Script ไปรันใน Supabase SQL Editor',
          tablesFound: [],
          missingTables: requiredTables,
        };
      } else if (error) {
        return {
          success: false,
          message: `เชื่อมต่อไม่สำเร็จ: ${error.message} (${error.hint || error.code || ''})`,
          tablesFound: [],
          missingTables: requiredTables,
        };
      }
      return {
        success: true,
        message: 'เชื่อมต่อ Supabase สำเร็จ',
        tablesFound: requiredTables,
        missingTables: [],
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อได้: ${err?.message || 'Network Error'}`,
      tablesFound: [],
      missingTables: requiredTables,
    };
  }
}
