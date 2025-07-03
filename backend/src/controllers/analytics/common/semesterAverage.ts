import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getSemesterAverageRatings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentResponses = await prisma.studentResponse.findMany({
      include: {
        question: {
          include: {
            form: {
              include: {
                subjectAllocation: {
                  include: {
                    semester: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const semesterRatings = new Map<number, number[]>();

    studentResponses.forEach((response) => {
      const semesterNumber = response.question.form.subjectAllocation.semester.semesterNumber;
      const value = typeof response.value === 'object'
        ? (response.value as { rating: number }).rating
        : Number(response.value);

      if (!semesterRatings.has(semesterNumber)) {
        semesterRatings.set(semesterNumber, []);
      }

      semesterRatings.get(semesterNumber)!.push(value);
    });

    const chartData = Array.from(semesterRatings.entries()).map(([semester, ratings]) => ({
      semester,
      averageRating: Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)),
      totalResponses: ratings.length
    }));

    // Sort by semester number
    chartData.sort((a, b) => a.semester - b.semester);

    res.status(200).json({
      semesterData: chartData
    });

  } catch (error) {
    console.error('Error in getSemesterAverageRatings:', error);
    res.status(500).json({ error: 'Error fetching semester-wise ratings' });
  }
};
