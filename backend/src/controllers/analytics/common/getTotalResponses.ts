import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTotalResponses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uniqueStudentCount = await prisma.studentResponse.findMany({
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    });

    res.status(200).json({
      success: true,
      message: "Total unique responses retrieved successfully",
      data: {
        totalUniqueResponses: uniqueStudentCount.length,
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch total unique responses",
      error: {
        code: "ANALYTICS_ERROR",
        details: "Error occurred while retrieving response counts"
      }
    });
  }
};
