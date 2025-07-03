import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getSubjectPerformanceData = async (
  req: Request,
  res: Response
) => {
  const { subjectId } = req.body;

  try {
    const responses = await prisma.studentResponse.findMany({
      where: {
        question: {
          subjectId: subjectId,
        },
      },
      include: {
        question: {
          include: {
            faculty: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
              },
            },
            form: {
              include: {
                division: {
                  select: {
                    divisionName: true,
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group responses by faculty, division and batch (for lab/lecture)
    const performanceMap = new Map<
      string,
      {
        facultyId: string;
        facultyName: string;
        facultyAbbr: string;
        divisionId: string;
        divisionName: string;
        batch: string;
        ratings: number[];
      }
    >();

    responses.forEach((response) => {
      const faculty = response.question.faculty;
      const division = response.question.form.division;
      const batch = response.question.batch; // 'None' for lecture, batch number for lab

      // Create unique key for faculty-division-batch combination
      const key = `${faculty.id}-${division.id}-${batch}`;

      const value =
        typeof response.value === 'object'
          ? (response.value as { rating: number }).rating
          : Number(response.value);

      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          facultyId: faculty.id,
          facultyName: faculty.name,
          facultyAbbr: faculty.abbreviation,
          divisionId: division.id,
          divisionName: division.divisionName,
          batch: batch,
          ratings: [],
        });
      }

      performanceMap.get(key)?.ratings.push(value);
    });

    // Calculate averages and format response
    const performanceData = Array.from(performanceMap.values()).map((data) => ({
      facultyId: data.facultyId,
      facultyName: data.facultyName,
      facultyAbbr: data.facultyAbbr,
      divisionId: data.divisionId,
      divisionName: data.divisionName,
      type: data.batch === 'None' ? 'LECTURE' : 'LAB',
      batch: data.batch === 'None' ? '-' : data.batch,
      averageScore: Number(
        (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(
          2
        )
      ),
      responseCount: data.ratings.length,
    }));

    // Separate lecture and lab data
    const result = {
      lectures: performanceData.filter((d) => d.type === 'LECTURE'),
      labs: performanceData.filter((d) => d.type === 'LAB'),
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subject performance data' });
  }
};
