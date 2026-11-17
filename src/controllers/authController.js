import { supabase, supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';

// Simple regex for email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password, name, location } = req.body;

    // 1. Validate inputs
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      throw new ApiError(400, 'Please provide a valid email address.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'Name is required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanLocation = location ? location.trim() : null;

    // 2. Register user in Supabase Auth
    // We use admin.createUser with email_confirm: true to prevent SMTP rate-limit blocking
    // in this college project environment, while storing zero passwords in public.users.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
      },
    });

    if (authError) {
      // Handle duplicate email registrations cleanly
      if (
        authError.code === 'email_exists' ||
        authError.message?.toLowerCase().includes('already been registered')
      ) {
        throw new ApiError(409, 'A user with this email address already exists. Please log in.');
      }
      throw new ApiError(400, authError.message || 'Failed to register user with Supabase Auth.');
    }

    const authUser = authData.user;

    // 3. Insert user profile into public.users
    // (Verified empirically that no automatic database trigger exists)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.id,
        name: cleanName,
        email: cleanEmail,
        location: cleanLocation,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete the newly created auth user so no orphaned auth user remains
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw new ApiError(500, `Failed to create user profile record: ${profileError.message}`);
    }

    // 4. Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          location: userProfile.location,
          createdAt: userProfile.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get session tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Authenticate against Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (loginError) {
      if (
        loginError.code === 'invalid_credentials' ||
        loginError.message?.toLowerCase().includes('invalid login credentials')
      ) {
        throw new ApiError(401, 'Invalid email or password.');
      }
      if (loginError.message?.toLowerCase().includes('email not confirmed')) {
        throw new ApiError(403, 'Email has not been confirmed yet. Please verify your email.');
      }
      throw new ApiError(400, loginError.message || 'Authentication failed.');
    }

    const { user, session } = loginData;

    // 3. Retrieve user profile from public.users
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 4. Return user and session details
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: profile?.name || user.user_metadata?.name || 'Student',
          location: profile?.location || null,
          createdAt: profile?.created_at || user.created_at,
        },
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresIn: session.expires_in,
          tokenType: session.token_type,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sign out user and revoke current session
 * @route   POST /api/auth/logout
 * @access  Private (Requires Bearer token)
 */
export const logout = async (req, res, next) => {
  try {
    // Revoke the session using Supabase Auth admin API.
    // signOut(uid) expects a user UUID (from the verified token), not a JWT string.
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized. Valid user authentication required.');
    }

    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId);

    if (signOutError) {
      // If session was already expired or revoked, still treat logout as successful
      console.warn('Notice during signOut:', signOutError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires Bearer token)
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Authenticated user profile retrieved successfully',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.userProfile?.name || req.user.user_metadata?.name || null,
          location: req.userProfile?.location || null,
          createdAt: req.userProfile?.created_at || req.user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  signup,
  login,
  logout,
  getMe,
};
