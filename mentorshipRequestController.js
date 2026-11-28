const {
  supabase, STATUS, sendSuccess, sendError, handleServerError,
  getUserId, isValidId, isNonEmptyString,
} = require('../utils/common');

// POST /api/mentorship-requests
exports.createMentorshipRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { mentor_id, message } = req.body || {};

    if (!isValidId(mentor_id)) return sendError(res, 400, 'A valid mentor_id is required');
    if (!isNonEmptyString(message, 1000)) return sendError(res, 400, 'message is required (max 1000 characters)');

    const { data: mentor, error: mErr } = await supabase
      .from('mentors').select('id, user_id').eq('id', mentor_id).maybeSingle();
    if (mErr) throw mErr;
    if (!mentor) return sendError(res, 404, 'Mentor not found');

    if (String(mentor.user_id) === String(userId))
      return sendError(res, 400, 'You cannot request mentorship from yourself');

    // Duplicate rule: no second pending/accepted request to the same mentor
    const { data: existing, error: dErr } = await supabase
      .from('mentorship_requests').select('id, status')
      .eq('mentor_id', mentor_id).eq('mentee_id', userId)
      .in('status', [STATUS.PENDING, STATUS.ACCEPTED]).limit(1);
    if (dErr) throw dErr;
    if (existing && existing.length > 0)
      return sendError(res, 409, `You already have a ${existing[0].status} request with this mentor`);

    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert({ mentor_id, mentee_id: userId, status: STATUS.PENDING, message: message.trim() })
      .select().single();
    if (error) throw error;

    return sendSuccess(res, 201, 'Mentorship request sent successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'createMentorshipRequest');
  }
};

// GET /api/mentorship-requests  (sent by me)
exports.getSentMentorshipRequests = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from('mentorship_requests').select('*').eq('mentee_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, 'Sent mentorship requests fetched successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'getSentMentorshipRequests');
  }
};

// GET /api/mentorship-requests/received  (sent to me as mentor)
exports.getReceivedMentorshipRequests = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { data: mentor, error: mErr } = await supabase
      .from('mentors').select('id').eq('user_id', userId).maybeSingle();
    if (mErr) throw mErr;
    if (!mentor) return sendError(res, 403, 'You are not registered as a mentor');

    const { data, error } = await supabase
      .from('mentorship_requests').select('*').eq('mentor_id', mentor.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return sendSuccess(res, 200, 'Received mentorship requests fetched successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'getReceivedMentorshipRequests');
  }
};

// PATCH /api/mentorship-requests/:id/status
exports.updateMentorshipRequestStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const status = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : undefined;

    if (!isValidId(id)) return sendError(res, 400, 'Invalid mentorship request id');
    if (![STATUS.ACCEPTED, STATUS.DECLINED].includes(status))
      return sendError(res, 400, `status must be either "${STATUS.ACCEPTED}" or "${STATUS.DECLINED}"`);

    const { data: request, error: rErr } = await supabase
      .from('mentorship_requests').select('*').eq('id', id).maybeSingle();
    if (rErr) throw rErr;
    if (!request) return sendError(res, 404, 'Mentorship request not found');

    const { data: mentor, error: mErr } = await supabase
      .from('mentors').select('id, user_id').eq('id', request.mentor_id).maybeSingle();
    if (mErr) throw mErr;
    if (!mentor || String(mentor.user_id) !== String(userId))
      return sendError(res, 403, 'Only the requested mentor can respond to this request');

    if (request.status !== STATUS.PENDING)
      return sendError(res, 409, `This request has already been ${request.status}`);

    const { data, error } = await supabase
      .from('mentorship_requests').update({ status }).eq('id', id).eq('status', STATUS.PENDING)
      .select().maybeSingle();
    if (error) throw error;
    if (!data) return sendError(res, 409, 'This request was already responded to');

    return sendSuccess(res, 200, `Mentorship request ${status} successfully`, data);
  } catch (err) {
    return handleServerError(res, err, 'updateMentorshipRequestStatus');
  }
};
