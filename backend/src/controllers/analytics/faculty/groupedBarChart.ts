import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubjectAnalytics {
  subjectName: string;
  overallAverage: number;
  facultyAverage: number;
}

interface GroupedBarChartResponse {
  facultyName: string;
  subjects: SubjectAnalytics[];
}

const parseRating = (value: any): number => {
  if (typeof value === 'string') {
    const parsed = parseInt(value);
    return !isNaN(parsed) ? parsed : 0;
  }
  return 0;
};

export const getGroupedBarChartData = async (req: Request, res: Response) => {
  const facultyId = req.body.facultyId;

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      select: { name: true },
    });

    const subjectsWithResponses = await prisma.feedbackQuestion.findMany({
      where: {
        facultyId: facultyId,
        responses: { some: {} },
      },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      distinct: ['subjectId'],
    });

    const subjectAnalytics: SubjectAnalytics[] = [];

    for (const subjectData of subjectsWithResponses) {
      const subjectId = subjectData.subject.id;

      const overallResponses = await prisma.studentResponse.findMany({
        where: {
          question: {
            subjectId: subjectId,
          },
        },
        select: {
          value: true,
        },
      });

      const facultyResponses = await prisma.studentResponse.findMany({
        where: {
          question: {
            subjectId: subjectId,
            facultyId: facultyId,
          },
        },
        select: {
          value: true,
        },
      });

      const overallRatings = overallResponses.map((r) => parseRating(r.value));
      const facultyRatings = facultyResponses.map((r) => parseRating(r.value));

      const overallAverage =
        overallRatings.length > 0
          ? overallRatings.reduce((sum, rating) => sum + rating, 0) /
            overallRatings.length
          : 0;

      const facultyAverage =
        facultyRatings.length > 0
          ? facultyRatings.reduce((sum, rating) => sum + rating, 0) /
            facultyRatings.length
          : 0;

      subjectAnalytics.push({
        subjectName: subjectData.subject.name,
        overallAverage: overallAverage,
        facultyAverage: facultyAverage,
      });
    }

    const response: GroupedBarChartResponse = {
      facultyName: faculty?.name || '',
      subjects: subjectAnalytics,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ error: 'Error generating grouped bar chart data' });
  }
};
