import express, { Router, Request, Response } from 'express';
import {
  register,
  superRegister,
  login,
  me,
  updatePassword,
} from '../../controllers/adminController';
import { isAuthenticated, requireSuperAdmin } from '../../middleware/auth';

const router: Router = express.Router();

router.post('/register', register);

router.post('/super/register', superRegister);

router.post('/login', login);

router.get('/me', isAuthenticated, me);

router.put('/updatepassword', isAuthenticated, updatePassword);

router.put(
  '/updatesuperpassword',
  isAuthenticated,
  requireSuperAdmin,
  updatePassword
);

export default router;
