const {
  supabase, OWNER_COLUMN, STATUS,
  sendSuccess, sendError, handleServerError,
  getUserId, isValidId, isNonEmptyString,
} = require('../utils/common');

// POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { resource_id, message } = req.body || {};

    if (!isValidId(resource_id)) return sendError(res, 400, 'A valid resource_id is required');
    if (message !== undefined && message !== null && !isNonEmptyString(message, 500))
      return sendError(res, 400, 'message must be a non-empty string up to 500 characters');

    const { data: resource, error: resErr } = await supabase
      .from('resources').select(`id, ${OWNER_COLUMN}`).eq('id', resource_id).maybeSingle();
    if (resErr) throw resErr;
    if (!resource) return sendError(res, 404, 'Resource not found');

    if (String(resource[OWNER_COLUMN]) === String(userId))
      return sendError(res, 400, 'You cannot request your own resource');

    // Duplicate rule: a user can't have another pending/accepted request for the same resource
    const { data: existing, error: dupErr } = await supabase
      .from('requests').select('id, status')
      .eq('resource_id', resource_id).eq('requester_id', userId)
      .in('status', [STATUS.PENDING, STATUS.ACCEPTED]).limit(1);
    if (dupErr) throw dupErr;
    if (existing && existing.length > 0)
      return sendError(res, 409, `You already have a ${existing[0].status} request for this resource`);

    const { data, error } = await supabase
      .from('requests')
      .insert({
        resource_id,
        requester_id: userId,
        status: STATUS.PENDING,
        message: message ? message.trim() : null,
      })
      .select().single();
    if (error) throw error;

    return sendSuccess(res, 201, 'Resource request sent successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'createRequest');
  }
};

// GET /api/requests  (requests made by me)
exports.getMyRequests = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from('requests').select('*').eq('requester_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return sendSuccess(res, 200, 'Your requests fetched successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'getMyRequests');
  }
};

// GET /api/requests/received  (requests for resources I own)
exports.getReceivedRequests = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { data: owned, error: ownErr } = await supabase
      .from('resources').select('id').eq(OWNER_COLUMN, userId);
    if (ownErr) throw ownErr;

    const ids = (owned || []).map((r) => r.id);
    if (ids.length === 0) return sendSuccess(res, 200, 'Received requests fetched successfully', []);

    const { data, error } = await supabase
      .from('requests').select('*').in('resource_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return sendSuccess(res, 200, 'Received requests fetched successfully', data);
  } catch (err) {
    return handleServerError(res, err, 'getReceivedRequests');
  }
};

// PATCH /api/requests/:id/status
exports.updateRequestStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const status = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : undefined;

    if (!isValidId(id)) return sendError(res, 400, 'Invalid request id');
    if (![STATUS.ACCEPTED, STATUS.DECLINED].includes(status))
      return sendError(res, 400, `status must be either "${STATUS.ACCEPTED}" or "${STATUS.DECLINED}"`);

    const { data: request, error: reqErr } = await supabase
      .from('requests').select('*').eq('id', id).maybeSingle();
    if (reqErr) throw reqErr;
    if (!request) return sendError(res, 404, 'Request not found');

    const { data: resource, error: resErr } = await supabase
      .from('resources').select(`id, ${OWNER_COLUMN}`).eq('id', request.resource_id).maybeSingle();
    if (resErr) throw resErr;
    if (!resource) return sendError(res, 404, 'Resource for this request no longer exists');

    if (String(resource[OWNER_COLUMN]) !== String(userId))
      return sendError(res, 403, 'Only the resource owner can respond to this request');

    if (request.status !== STATUS.PENDING)
      return sendError(res, 409, `This request has already been ${request.status}`);

    // .eq('status','pending') guards against two simultaneous responses
    const { data, error } = await supabase
      .from('requests').update({ status }).eq('id', id).eq('status', STATUS.PENDING)
      .select().maybeSingle();
    if (error) throw error;
    if (!data) return sendError(res, 409, 'This request was already responded to');

    return sendSuccess(res, 200, `Request ${status} successfully`, data);
  } catch (err) {
    return handleServerError(res, err, 'updateRequestStatus');
  }
};
