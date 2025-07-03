import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getSubjectWiseRatings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId, divisionId } = req.body;

    const subjectAbbreviations = await prisma.subject.findMany({
      select: {
        id: true,
        abbreviation: true,
      },
    });

    const abbreviationMap = new Map<string, string>();
    subjectAbbreviations.forEach((subject) => {
      abbreviationMap.set(subject.id, subject.abbreviation);
    });
    const whereClause = {
      question: {
        form: {
          subjectAllocation: {
            ...(semesterId !== 'All' && { semesterId: semesterId }),
            ...(divisionId && { divisionId: divisionId }),
          },
        },
      },
    };


    const studentResponses = await prisma.studentResponse.findMany({
      where: whereClause,
      include: {
        question: {
          include: {
            subject: true,
            form: {
              include: {
                subjectAllocation: {
                  include: {
                    semester: true,
                    division: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Regular division-wise data processing
    const subjectRatings = new Map<
      string,
      {
        LECTURE: number[];
        LAB: number[];
        subjectName: string;
        semesterNumber: number;
        divisionName?: string;
      }
    >();

    studentResponses.forEach((response) => {
      const subjectId = response.question.subject.id;
      const divisionId = response.question.form.subjectAllocation.division.id;
      const mapKey = `${subjectId}-${divisionId}`;

      if (!subjectRatings.has(mapKey)) {
        subjectRatings.set(mapKey, {
          LECTURE: [],
          LAB: [],
          subjectName: response.question.subject.abbreviation,
          semesterNumber:
            response.question.form.subjectAllocation.semester.semesterNumber,
          divisionName:
            response.question.form.subjectAllocation.division.divisionName,
        });
      }

      const ratings = subjectRatings.get(mapKey)!;
      const value =
        typeof response.value === 'object'
          ? (response.value as { rating: number }).rating
          : Number(response.value);

      if (response.question.batch === 'None') {
        ratings.LECTURE.push(value);
      } else {
        ratings.LAB.push(value);
      }
    });

    // Semester-wide aggregates (ALL division)
    const semesterSubjects = new Map<
      string,
      {
        LECTURE: number[];
        LAB: number[];
        subjectName: string;
        semesterNumber: number;
      }
    >();

    studentResponses.forEach((response) => {
      const subjectId = response.question.subject.id;
      const value =
        typeof response.value === 'object'
          ? (response.value as { rating: number }).rating
          : Number(response.value);

      if (!semesterSubjects.has(subjectId)) {
        semesterSubjects.set(subjectId, {
          LECTURE: [],
          LAB: [],
          subjectName: response.question.subject.abbreviation,
          semesterNumber:
            response.question.form.subjectAllocation.semester.semesterNumber,
        });
      }

      const ratings = semesterSubjects.get(subjectId)!;
      if (response.question.batch === 'None') {
        ratings.LECTURE.push(value);
      } else {
        ratings.LAB.push(value);
      }
    });

    // Process regular division data
    const chartData = Array.from(subjectRatings.values()).map((data) => ({
      subjectName: data.subjectName,
      semesterNumber: data.semesterNumber,
      divisionName: data.divisionName,
      lectureAverage:
        data.LECTURE.length > 0
          ? Number(
              (
                data.LECTURE.reduce((a, b) => a + b, 0) / data.LECTURE.length
              ).toFixed(2)
            )
          : 0,
      labAverage:
        data.LAB.length > 0
          ? Number(data.LAB.reduce((a, b) => a + b, 0) / data.LAB.length)
          : 0,
      totalLectureResponses: data.LECTURE.length,
      totalLabResponses: data.LAB.length,
    }));

    // Add ALL division aggregates
    const allDivisionData = Array.from(semesterSubjects.values()).map(
      (data) => ({
        subjectName: data.subjectName,
        semesterNumber: data.semesterNumber,
        divisionName: 'ALL',
        lectureAverage:
          data.LECTURE.length > 0
            ? Number(
                (
                  data.LECTURE.reduce((a, b) => a + b, 0) / data.LECTURE.length
                ).toFixed(2)
              )
            : 0,
        labAverage:
          data.LAB.length > 0
            ? Number(
                (data.LAB.reduce((a, b) => a + b, 0) / data.LAB.length).toFixed(
                  2
                )
              )
            : 0,
        totalLectureResponses: data.LECTURE.length,
        totalLabResponses: data.LAB.length,
      })
    );

    chartData.push(...allDivisionData);

    // Sort by semester number, division name, and subject name
    chartData.sort((a, b) => {
      if (a.semesterNumber !== b.semesterNumber) {
        return a.semesterNumber - b.semesterNumber;
      }
      if (a.divisionName !== b.divisionName) {
        return (a.divisionName || '').localeCompare(b.divisionName || '');
      }
      return a.subjectName.localeCompare(b.subjectName);
    });


    res.status(200).json({
      semesterId,
      divisionId,
      subjectData: chartData,
    });
  } catch (error) {
    console.error('Error in getSubjectWiseRatings:', error);
    res.status(500).json({ error: 'Error fetching subject-wise ratings' });
  }
};
