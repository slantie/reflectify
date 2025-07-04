import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Interface for common registration input fields
interface RegisterInput {
  name: string;
  email: string;
  password: string;
  designation: string;
}

// Helper function to send consistent error responses
const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string
): void => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

// Helper function to generate JWT token
const generateToken = (id: string, email: string, isSuper: boolean): string => {
  // Ensure JWT_SECRET is defined in environment variables
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    // In a real application, you might throw a specific error or handle this more robustly
    throw new Error('Server configuration error: JWT secret missing.');
  }
  return jwt.sign({ id, email, isSuper }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// Private helper function to handle common admin creation logic
const _createAdmin = async (
  res: Response,
  { name, email, password, designation }: RegisterInput,
  isSuper: boolean,
  errorMessage: string
) => {
  // Input validation
  if (!name || !email || !password || !designation) {
    return sendErrorResponse(res, 400, 'Please provide all required fields');
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendErrorResponse(res, 400, 'Please provide a valid email address');
  }

  // Check if email already exists (for non-super admin registration)
  if (!isSuper) {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      return sendErrorResponse(res, 400, 'Email already registered');
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin in the database
  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
      designation,
      isSuper,
    },
  });

  const token = generateToken(admin.id, admin.email, admin.isSuper);

  res.status(201).json({
    success: true,
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      designation: admin.designation,
      isSuper: admin.isSuper,
    },
  });
};

/**
 * @description Register a new regular admin/user.
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, designation }: RegisterInput = req.body;
    await _createAdmin(
      res,
      { name, email, password, designation },
      false,
      'Error creating account'
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    sendErrorResponse(res, 500, error.message || 'Error creating account');
  }
};

/**
 * @description Register a new super admin. This route should be highly protected.
 * @route POST /api/auth/super/register
 * @access Public (but restricted by application logic)
 */
export const superRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, designation }: RegisterInput = req.body;

    // Check if super admin already exists before attempting creation
    const existingSuperAdmin = await prisma.admin.findFirst({
      where: { isSuper: true },
    });

    if (existingSuperAdmin) {
      return sendErrorResponse(res, 400, 'Super admin already exists');
    }

    await _createAdmin(
      res,
      { name, email, password, designation },
      true,
      'Error creating super admin account'
    );
  } catch (error: any) {
    console.error('Super registration error:', error);
    sendErrorResponse(
      res,
      500,
      error.message || 'Error creating super admin account'
    );
  }
};

/**
 * @description Authenticate a user and provide a JWT token.
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendErrorResponse(res, 400, 'Please provide email and password');
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return sendErrorResponse(res, 401, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return sendErrorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken(admin.id, admin.email, admin.isSuper);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        designation: admin.designation,
        isSuper: admin.isSuper,
      },
    });
  } catch (error: any) {
    // Added type for error
    console.error('Login error:', error);
    sendErrorResponse(res, 500, error.message || 'Error logging in');
  }
};

/**
 * @description Get the currently authenticated admin's profile.
 * @route GET /api/auth/me
 * @access Private (requires authentication via isAuthenticated middleware)
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.admin is populated by the isAuthenticated middleware
    if (!req.admin?.id) {
      return sendErrorResponse(res, 401, 'Authentication required'); // Should ideally not happen if isAuthenticated runs first
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        isSuper: true,
      },
    });

    if (!admin) {
      return sendErrorResponse(res, 404, 'Admin not found');
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    // Added type for error
    console.error('Fetch admin details error:', error);
    sendErrorResponse(
      res,
      500,
      error.message || 'Error fetching admin details'
    );
  }
};

/**
 * @description Update the password for the currently authenticated admin.
 * @route PUT /api/auth/updatepassword
 * @access Private (requires authentication)
 */
export const updatePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendErrorResponse(
        res,
        400,
        'Please provide both current and new password'
      );
    }

    if (!req.admin?.id) {
      return sendErrorResponse(res, 401, 'Authentication required');
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
    });

    if (!admin) {
      return sendErrorResponse(res, 404, 'Admin not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return sendErrorResponse(res, 401, 'Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    // Added type for error
    console.error('Update password error:', error);
    sendErrorResponse(res, 500, error.message || 'Error updating password');
  }
};
