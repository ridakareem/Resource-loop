const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/common');
const c = require('../controllers/mentorshipRequestController');

router.use(authenticate);

router.post('/', c.createMentorshipRequest);
router.get('/', c.getSentMentorshipRequests);
router.get('/received', c.getReceivedMentorshipRequests);
router.patch('/:id/status', c.updateMentorshipRequestStatus);

module.exports = router;
