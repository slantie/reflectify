import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  designation: string;
}

const generateToken = (id: string, email: string, isSuper: boolean): string => {
  return jwt.sign({ id, email, isSuper }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, designation }: RegisterInput = req.body;

    // Input validation
    if (!name || !email || !password || !designation) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    // Check existing user
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        designation,
        isSuper: false,
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating account',
    });
  }
};

export const superRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, designation }: RegisterInput = req.body;

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.admin.findFirst({
      where: { isSuper: true },
    });

    if (existingSuperAdmin) {
      res.status(400).json({
        success: false,
        message: 'Super admin already exists',
      });
      return;
    }

    // Input validation
    if (!name || !email || !password || !designation) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create super admin
    const superAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        designation,
        isSuper: true,
      },
    });

    const token = generateToken(
      superAdmin.id,
      superAdmin.email,
      superAdmin.isSuper
    );

    res.status(201).json({
      success: true,
      token,
      admin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        designation: superAdmin.designation,
        isSuper: superAdmin.isSuper,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating super admin account',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {

    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin?.id },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        isSuper: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin details',
    });
  }
};

export const updatePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin?.id },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
    });
  }
};
