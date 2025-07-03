import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getAcademicStructure = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const academicStructure = await prisma.department.findMany({
      include: {
        semesters: {
          include: {
            divisions: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: academicStructure
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Error fetching academic structure' 
    });
  }
};
