import { Router } from 'express';
import { signup, login, logout, getMe } from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT session tokens
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate current user session token
 * @access  Private
 */
router.post('/logout', authenticateUser, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Private
 */
router.get('/me', authenticateUser, getMe);

export default router;
