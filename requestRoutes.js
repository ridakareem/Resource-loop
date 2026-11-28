const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/common');
const c = require('../controllers/requestController');

router.use(authenticate);

router.post('/', c.createRequest);
router.get('/', c.getMyRequests);
router.get('/received', c.getReceivedRequests); // keep above any "/:id" GET routes
router.patch('/:id/status', c.updateRequestStatus);

module.exports = router;
