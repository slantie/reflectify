import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getUniqueFaculties = async (req: Request, res: Response) => {
  try {
    const uniqueFaculties = await prisma.feedbackQuestion.groupBy({
      by: ['facultyId'],
      where: {
        responses: {
          some: {},
        },
      },
      _count: true,
    });

    const facultyDetails = await prisma.faculty.findMany({
      where: {
        id: {
          in: uniqueFaculties.map((f) => f.facultyId),
        },
      },
      select: {
        id: true,
        name: true,
        abbreviation: true,
      },
    });

    res.status(200).json(facultyDetails);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching faculty list' });
  }
};

export const getUniqueSubjects = async (req: Request, res: Response) => {
  try {
    const uniqueSubjects = await prisma.feedbackQuestion.groupBy({
      by: ['subjectId'],
      where: {
        responses: {
          some: {},
        },
      },
      _count: true,
    });

    const subjectDetails = await prisma.subject.findMany({
      where: {
        id: {
          in: uniqueSubjects.map((s) => s.subjectId),
        },
      },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        subjectCode: true,
      },
    });

    res.status(200).json(subjectDetails);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subject list' });
  }
};

export const getFacultyRadarData = async (req: Request, res: Response) => {
  const { facultyId } = req.body;

  try {
    const studentResponses = await prisma.studentResponse.findMany({
      where: {
        question: {
          facultyId: facultyId,
        },
      },
      include: {
        question: {
          include: {
            subject: true,
            faculty: true,
          },
        },
      },
    });

    const subjectRatings = new Map<
      string,
      {
        LECTURE: number[];
        LAB: number[];
      }
    >();

    studentResponses.forEach((response) => {
      const subjectName = response.question.subject.name;
      const value =
        typeof response.value === 'object'
          ? (response.value as { rating: number }).rating
          : Number(response.value);
      const batch = response.question.batch;

      if (!subjectRatings.has(subjectName)) {
        subjectRatings.set(subjectName, {
          LECTURE: [],
          LAB: [],
        });
      }

      const ratings = subjectRatings.get(subjectName)!;

      if (batch === 'None') {
        ratings.LECTURE.push(value);
      } else {
        ratings.LAB.push(value);
      }
    });

    const subjects = Array.from(subjectRatings.keys());
    const lectureRatings: number[] = [];
    const labRatings: number[] = [];

    subjects.forEach((subject) => {
      const ratings = subjectRatings.get(subject)!;

      // Return 0 if no ratings found
      const lectureAvg =
        ratings.LECTURE.length > 0
          ? Number(
              (
                ratings.LECTURE.reduce((a, b) => a + b, 0) /
                ratings.LECTURE.length
              ).toFixed(2)
            )
          : 0;

      const labAvg =
        ratings.LAB.length > 0
          ? Number(
              (
                ratings.LAB.reduce((a, b) => a + b, 0) / ratings.LAB.length
              ).toFixed(2)
            )
          : 0;

      lectureRatings.push(lectureAvg);
      labRatings.push(labAvg);
    });

    const radarData = {
      labels: subjects,
      datasets: [
        {
          label: 'Lecture Ratings',
          data: lectureRatings,
        },
        {
          label: 'Lab Ratings',
          data: labRatings,
        },
      ],
    };

    res.status(200).json(radarData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching radar chart data' });
  }
};
