import { Router } from 'express';
import config from '../config/env.js';

import { testSupabaseConnection } from '../config/supabase.js';

const router = Router();

/**
 * @route   GET /health
 * @desc    System health and liveness check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResourceLoop API is healthy and operational',
    data: {
      uptime: `${process.uptime().toFixed(2)}s`,
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

/**
 * @route   GET /health/db
 * @desc    Safe Supabase database and auth connection check
 * @access  Public
 */
router.get('/db', async (req, res, next) => {
  try {
    const result = await testSupabaseConnection();
    res.status(result.success ? 200 : 503).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
