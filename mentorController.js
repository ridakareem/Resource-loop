const {
  supabase, sendSuccess, sendError, handleServerError,
  getUserId, isValidId, isNonEmptyString,
} = require('../utils/common');

// Validates expertise / bio / availability. `partial` = PUT may send only some fields.
const validateMentorBody = (body = {}, partial = false) => {
  const errors = [];
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('expertise')) {
    const e = body.expertise;
    const ok = isNonEmptyString(e, 300) ||
      (Array.isArray(e) && e.length > 0 && e.every((x) => isNonEmptyString(x, 100)));
    if (!ok) errors.push('expertise is required (non-empty string or array of strings)');
    else out.expertise = Array.isArray(e) ? e.map((x) => x.trim()) : e.trim();
  }
  if (!partial || has('bio')) {
    if (!isNonEmptyString(body.bio, 2000)) errors.push('bio is required (max 2000 characters)');
    else out.bio = body.bio.trim();
  }
  if (!partial || has('availability')) {
    const a = body.availability;
    if (typeof a === 'boolean') out.availability = a;
    else if (isNonEmptyString(a, 300)) out.availability = a.trim();
    else errors.push('availability is required (e.g. "Weekends 6-8 PM")');
  }
  if (partial && Object.keys(out).length === 0 && errors.length === 0)
    errors.push('Provide at least one of: expertise, bio, availability');

  return { errors, out };
};

// POST /api/mentors
exports.registerMentor = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { errors, out } = validateMentorBody(req.body, false);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const { data: existing, error: exErr } = await supabase
      .from('mentors').select('id').eq('user_id', userId).maybeSingle();
    if (exErr) throw exErr;
    if (existing) return sendError(res, 409, 'You are already registered as a mentor');

    const { data, error } = await supabase
      .from('mentors').insert({ user_id: userId, ...out }).select().single();
    if (error) throw error;

    return sendSuccess(res, 201, 'Registered as mentor successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'registerMentor');
  }
};

// PUT /api/mentors/me
exports.updateMyMentorProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { errors, out } = validateMentorBody(req.body, true);
    if (errors.length) return sendError(res, 400, 'Validation failed', errors);

    const { data, error } = await supabase
      .from('mentors').update(out).eq('user_id', userId).select().maybeSingle();
    if (error) throw error;
    if (!data) return sendError(res, 404, 'You are not registered as a mentor');

    return sendSuccess(res, 200, 'Mentor profile updated successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'updateMyMentorProfile');
  }
};

// GET /api/mentors
exports.getAllMentors = async (req, res) => {
  try {
    const { data, error } = await supabase.from('mentors').select('*').order('id', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, 'Mentors fetched successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'getAllMentors');
  }
};

// GET /api/mentors/:id
exports.getMentorById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return sendError(res, 400, 'Invalid mentor id');

    const { data, error } = await supabase.from('mentors').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return sendError(res, 404, 'Mentor not found');

    return sendSuccess(res, 200, 'Mentor fetched successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'getMentorById');
  }
};
