/**
 * utils/common.js  (owned by the Requests & Mentorship module)
 * Shared helpers: Supabase client, auth middleware resolver, response format, validators.
 *
 * >>> If your teammate's files export differently, ONLY edit the two "resolve" blocks below. <<<
 */

// ---- Resolve Supabase client from config/supabase.js (supports module.exports = client OR { supabase }) ----
const supabaseModule = require('../config/supabase');
const supabase = supabaseModule.supabase || supabaseModule.default || supabaseModule;

// ---- Resolve auth middleware (supports function export OR { protect | authenticate | verifyToken | authMiddleware }) ----
const authModule = require('../middleware/authMiddleware');
const authenticate =
  typeof authModule === 'function'
    ? authModule
    : authModule.protect ||
      authModule.authenticate ||
      authModule.verifyToken ||
      authModule.authMiddleware ||
      authModule.default;

if (typeof authenticate !== 'function') {
  throw new Error('Could not resolve auth middleware. Edit utils/common.js to match middleware/authMiddleware.js exports.');
}

// ---- Column / value assumptions (change here if the agreed schema differs) ----
const OWNER_COLUMN = 'owner_id'; // column in `resources` that holds the owner's user id
const STATUS = { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' };

// ---- Consistent JSON response format ----
const sendSuccess = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({ success: true, message, data });

const sendError = (res, statusCode, message, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors ? { errors } : {}) });

const handleServerError = (res, err, context) => {
  console.error(`[${context}]`, err);
  return sendError(res, 500, 'Internal server error');
};

// ---- Auth user id: ALWAYS from the verified token (set by auth middleware), never from request body ----
const getUserId = (req) => (req.user ? req.user.id || req.user.sub || req.user.userId : undefined);

// ---- Validators ----
const isValidId = (v) =>
  (typeof v === 'string' || typeof v === 'number') && /^[A-Za-z0-9_-]{1,64}$/.test(String(v).trim());

const isNonEmptyString = (v, max = 2000) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

module.exports = {
  supabase,
  authenticate,
  OWNER_COLUMN,
  STATUS,
  sendSuccess,
  sendError,
  handleServerError,
  getUserId,
  isValidId,
  isNonEmptyString,
};
