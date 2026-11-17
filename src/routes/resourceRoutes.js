import { Router } from 'express';
import {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
} from '../controllers/resourceController.js';
import { authenticateUser, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route   GET /api/resources?search=&category=&page=&limit=
 * @desc    List available resources. Optional search matches title or description.
 *          Optional category is an exact case-insensitive match. Both can be combined.
 * @access  Public
 */
router.get('/', optionalAuth, getAllResources);

/**
 * @route   GET /api/resources/:id
 * @desc    Fetch one resource by UUID
 * @access  Public
 */
router.get('/:id', optionalAuth, getResourceById);

/**
 * @route   POST /api/resources
 * @desc    Create a new resource
 * @access  Private (Requires Bearer token)
 */
router.post('/', authenticateUser, createResource);

/**
 * @route   PUT /api/resources/:id
 * @desc    Update an existing resource (Owner only)
 * @access  Private (Requires Bearer token)
 */
router.put('/:id', authenticateUser, updateResource);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete a resource and clean up associated storage photo (Owner only)
 * @access  Private (Requires Bearer token)
 */
router.delete('/:id', authenticateUser, deleteResource);

export default router;
