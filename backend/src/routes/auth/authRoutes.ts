import express, { Router } from 'express';
// Import controller functions for authentication and user management
import {
  register,
  superRegister,
  login,
  me,
  updatePassword,
} from '../../controllers/adminController'; // Assuming adminController handles user/admin logic
// Import authentication and authorization middleware
import { isAuthenticated, requireSuperAdmin } from '../../middleware/auth';

const router: Router = express.Router();

/**
 * @route POST /api/auth/register
 * @description Register a new regular admin/user.
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/super/register
 * @description Register a new super admin. This route should be highly protected (e.g., only accessible once, or via specific setup).
 * @access Public (but should be restricted by application logic/setup)
 */
router.post('/super/register', superRegister);

/**
 * @route POST /api/auth/login
 * @description Authenticate a user and provide a token.
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/me
 * @description Get the currently authenticated user's profile.
 * @access Private (requires authentication)
 */
router.get('/me', isAuthenticated, me);

/**
 * @route PUT /api/auth/updatepassword
 * @description Update the password for the currently authenticated user.
 * @access Private (requires authentication)
 */
router.put('/updatepassword', isAuthenticated, updatePassword);

/**
 * @route PUT /api/auth/updatesuperpassword
 * @description Update the password for a super admin. Requires super admin privileges.
 * @access Private (requires authentication and super admin role)
 */
router.put(
  '/updatesuperpassword',
  isAuthenticated,
  requireSuperAdmin,
  updatePassword
);

export default router;
