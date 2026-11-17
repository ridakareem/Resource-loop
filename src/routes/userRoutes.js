import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { getMyResources } from '../controllers/resourceController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = Router();

// All user profile routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/users/me
 * @desc    Fetch current authenticated user profile
 * @access  Private (Bearer token)
 */
router.get('/me', getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current authenticated user name and location
 * @access  Private (Bearer token)
 */
router.put('/me', updateProfile);

/**
 * @route   GET /api/users/me/resources
 * @desc    Fetch resources owned by the current authenticated user (newest first)
 * @access  Private (Bearer token)
 */
router.get('/me/resources', getMyResources);

export default router;
