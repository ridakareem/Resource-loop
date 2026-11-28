const express = require('express');
const router = express.Router();
const { authenticate } = require('../utils/common');
const c = require('../controllers/mentorController');

router.use(authenticate);

router.post('/', c.registerMentor);
router.put('/me', c.updateMyMentorProfile);
router.get('/', c.getAllMentors);
router.get('/:id', c.getMentorById);

module.exports = router;
