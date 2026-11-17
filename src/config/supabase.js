import { createClient } from '@supabase/supabase-js';
import config from './env.js';

const { url: supabaseUrl, anonKey, serviceRoleKey } = config.supabase;

/**
 * Standard Supabase client initialized with the Anonymous / Publishable Key.
 *
 * Use this client for:
 * - Public data reads/writes permitted by Row Level Security (RLS) policies
 * - User authentication methods (e.g. sign in, sign up, password reset)
 *
 * SECURITY:
 * - This client operates under the PostgreSQL `anon` role.
 * - Always enforces Row Level Security (RLS) policies.
 */
export const supabase = supabaseUrl && anonKey
  ? createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Creates a user-scoped Supabase client authenticated with the user's JWT.
 *
 * Use this client for:
 * - ANY user-specific operation (fetching profile, creating/editing resources)
 * - Ensuring PostgreSQL Row Level Security (RLS) evaluates `auth.uid()`
 *
 * @param {string} accessToken - The user's JWT from `req.headers.authorization`
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const createUserClient = (accessToken) => {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase URL and Anon Key must be configured to create a client.');
  }
  if (!accessToken) {
    throw new Error('Access token is required to create a user-scoped Supabase client.');
  }

  // Strip "Bearer " prefix if passed in raw header format
  const token = accessToken.startsWith('Bearer ') ? accessToken.slice(7).trim() : accessToken;

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

/**
 * Privileged Administrative Supabase client initialized with the Service Role Key.
 *
 * ⚠️ CRITICAL SECURITY WARNING ⚠️
 * - The service role key BYPASSES all Row Level Security (RLS) policies.
 * - NEVER use this client for regular user operations.
 * - NEVER send this key to the frontend or expose it in API responses.
 * - Only use this for internal backend tasks (e.g., automated cleanups, background jobs,
 *   admin user deletion) where user context does not exist.
 */
export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Safely tests the connection to the Supabase project.
 *
 * Validates configuration and sends a lightweight ping to Supabase REST & Auth services
 * without modifying any data or altering database state.
 *
 * @returns {Promise<{
 *   success: boolean;
 *   message: string;
 *   details: {
 *     urlConfigured: boolean;
 *     anonKeyConfigured: boolean;
 *     serviceRoleKeyConfigured: boolean;
 *     restStatus?: string;
 *     authStatus?: string;
 *     error?: string;
 *   }
 * }>}
 */
export const testSupabaseConnection = async () => {
  const details = {
    urlConfigured: Boolean(supabaseUrl),
    anonKeyConfigured: Boolean(anonKey),
    serviceRoleKeyConfigured: Boolean(serviceRoleKey),
  };

  // 1. Validate environment configuration
  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      message: 'Supabase configuration is incomplete. Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env',
      details: {
        ...details,
        error: 'Please define SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.',
      },
    };
  }

  try {
    // 2. Validate URL format
    const parsedUrl = new URL(supabaseUrl);
    if (!parsedUrl.protocol.startsWith('http')) {
      throw new Error(`Invalid SUPABASE_URL protocol: ${parsedUrl.protocol}. Must be http or https.`);
    }

    // 3. Ping Supabase Auth health endpoint
    const authHealthUrl = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1/health`;
    const authResponse = await fetch(authHealthUrl, {
      headers: {
        apikey: anonKey,
      },
    });

    details.authStatus = authResponse.ok
      ? `OK (${authResponse.status})`
      : `HTTP ${authResponse.status}: ${authResponse.statusText}`;

    // 4. Ping Supabase REST endpoint (OpenAPI definition check)
    const restHealthUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/`;
    const restResponse = await fetch(restHealthUrl, {
      headers: {
        apikey: anonKey,
      },
    });

    details.restStatus = restResponse.ok
      ? `OK (${restResponse.status})`
      : `HTTP ${restResponse.status}: ${restResponse.statusText}`;

    const isConnected = authResponse.ok || restResponse.ok;

    if (!isConnected) {
      return {
        success: false,
        message: 'Connected to Supabase host, but received non-OK responses from services.',
        details: {
          ...details,
          error: `Auth check: ${details.authStatus}, REST check: ${details.restStatus}. Verify your SUPABASE_ANON_KEY.`,
        },
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase project!',
      details,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to establish connection to Supabase.',
      details: {
        ...details,
        error: error.message || 'Unknown network error',
      },
    };
  }
};

export default {
  supabase,
  createUserClient,
  supabaseAdmin,
  testSupabaseConnection,
};
