import { supabase, createUserClient, supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to strictly authenticate requests using Supabase Auth JWT.
 * Verifies the bearer token against Supabase Auth, retrieves the user profile,
 * and attaches user details and a user-scoped Supabase client to the request.
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        401,
        'Authentication required. Please provide a valid Bearer token in the Authorization header.'
      );
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      throw new ApiError(401, 'Authentication token is empty or missing.');
    }

    // Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      const isExpired = authError?.message?.toLowerCase().includes('expired') ||
                        authError?.code === 'bad_jwt';
      const message = isExpired
        ? 'Session has expired or is invalid. Please log in again.'
        : 'Invalid authorization token. Access denied.';

      throw new ApiError(401, message);
    }

    const authUser = authData.user;

    // Fetch the user's profile from public.users table
    let userProfile = null;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!profileError && profile) {
      userProfile = profile;
    }

    // Attach authenticated context to Express request
    req.user = authUser;
    req.userProfile = userProfile;
    req.token = token;
    req.userClient = createUserClient(token);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, attaches user context and userClient.
 * If absent or invalid, proceeds without failing.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]?.trim();
      if (token) {
        const { data: authData } = await supabase.auth.getUser(token);
        if (authData?.user) {
          req.user = authData.user;
          req.token = token;
          req.userClient = createUserClient(token);
        }
      }
    }
    next();
  } catch {
    next();
  }
};

export default authenticateUser;
