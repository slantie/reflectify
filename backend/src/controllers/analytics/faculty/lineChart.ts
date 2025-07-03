import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getFacultyPerformanceData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { facultyId } = req.body;

    if (!facultyId) {
      res.status(400).json({ error: 'Faculty ID is required' });
      return;
    }

    const studentResponses = await prisma.studentResponse.findMany({
      where: {
        question: {
          facultyId: facultyId,
        },
      },
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

    const semesterData = new Map<
      number,
      {
        LECTURE: number[];
        LAB: number[];
      }
    >();

    studentResponses.forEach((response) => {
      const semesterNumber = response.question.form.subjectAllocation.semester.semesterNumber;
      const value = typeof response.value === 'object' 
        ? (response.value as { rating: number }).rating 
        : Number(response.value);
      const batch = response.question.batch;

      if (!semesterData.has(semesterNumber)) {
        semesterData.set(semesterNumber, {
          LECTURE: [],
          LAB: [],
        });
      }

      const ratings = semesterData.get(semesterNumber)!;

      if (batch === 'None') {
        ratings.LECTURE.push(value);
      } else {
        ratings.LAB.push(value);
      }
    });

    const chartData = Array.from(semesterData.entries()).map(([semester, ratings]) => ({
      semester,
      lectureAverage: ratings.LECTURE.length > 0
        ? Number((ratings.LECTURE.reduce((a, b) => a + b, 0) / ratings.LECTURE.length).toFixed(2))
        : 0,
      labAverage: ratings.LAB.length > 0
        ? Number((ratings.LAB.reduce((a, b) => a + b, 0) / ratings.LAB.length).toFixed(2))
        : 0,
    }));

    // Sort by semester number
    chartData.sort((a, b) => a.semester - b.semester);

    res.status(200).json({
      facultyId,
      performanceData: chartData,
    });

  } catch (error) {
    console.error('Error in getFacultyPerformanceData:', error);
    res.status(500).json({ error: 'Error fetching faculty performance data' });
  }
};