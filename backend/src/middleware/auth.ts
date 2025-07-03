import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include admin
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

interface JwtPayload {
  id: string;
  email: string;
  isSuper: boolean;
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

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

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.admin?.isSuper) {
    res.status(403).json({
      success: false,
      message: 'This route requires super admin privileges',
    });
    return;
  }
  next();
};
