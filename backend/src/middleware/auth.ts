import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'; // Import specific JWT error types
import prisma from '../lib/prisma'; // Assuming this path is correct for your Prisma client instance

// Extend Express Request type to include admin details
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        name: string;
        isSuper: boolean;
        designation: string;
      };
    }
  }
}

// Interface for the JWT payload structure
interface JwtPayload {
  id: string;
  email: string;
  isSuper: boolean;
}

// Helper function for consistent error responses from middleware
const sendAuthError = (
  res: Response,
  statusCode: number,
  message: string
): void => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * @description Middleware to authenticate requests using JWT.
 * It extracts the token from the Authorization header, verifies it,
 * and attaches the authenticated admin's details to `req.admin`.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @access Private
 */
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check if token is present in Authorization header (Bearer token)
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found, return 401 Unauthorized
    if (!token) {
      return sendAuthError(
        res,
        401,
        'Not authorized to access this route: No token provided.'
      );
    }

    // Ensure JWT_SECRET is defined in environment variables for verification
    if (!process.env.JWT_SECRET) {
      console.error('SERVER CONFIG ERROR: JWT_SECRET is not defined.');
      // In a production environment, you might want to crash or have a more robust startup check
      return sendAuthError(res, 500, 'Server configuration error.');
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Find the admin in the database using the ID from the decoded token
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuper: true,
        designation: true,
      },
    });

    // If admin not found (e.g., user deleted), return 401 Unauthorized
    if (!admin) {
      return sendAuthError(res, 401, 'Not authorized: User no longer exists.');
    }

    // Attach admin details to the request object for subsequent middleware/controllers
    req.admin = admin;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle specific JWT errors for more informative responses
    if (error instanceof TokenExpiredError) {
      return sendAuthError(res, 401, 'Not authorized: Token expired.');
    } else if (error instanceof JsonWebTokenError) {
      return sendAuthError(res, 401, 'Not authorized: Invalid token.');
    } else {
      // Catch any other unexpected errors during authentication
      console.error('Authentication error:', error);
      return sendAuthError(res, 401, 'Not authorized to access this route.');
    }
  }
};

/**
 * @description Middleware to restrict access to super admin users only.
 * This middleware should be used after `isAuthenticated`.
 * @param {Request} req - Express request object (expected to have `req.admin` populated)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @access Private (Super Admin Only)
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if req.admin exists and if the user is a super admin
  if (!req.admin?.isSuper) {
    return sendAuthError(
      res,
      403,
      'Access denied: This route requires super admin privileges.'
    );
  }
  next(); // User is a super admin, proceed
};
