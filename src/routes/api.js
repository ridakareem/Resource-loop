import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import resourceRoutes from './resourceRoutes.js';

const router = Router();

// Health check endpoint under /api/v1/health
router.use('/health', healthRoutes);

// Authentication routes under /api/v1/auth
router.use('/auth', authRoutes);

// User profile routes under /api/v1/users
router.use('/users', userRoutes);

// Resource management routes under /api/v1/resources
router.use('/resources', resourceRoutes);

export default router;
