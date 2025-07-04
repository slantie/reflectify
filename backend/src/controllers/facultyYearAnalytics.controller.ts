import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for single faculty performance (existing)
const facultyPerformanceParamsSchema = z.object({
  academicYearId: z.string().uuid('Invalid academicYearId format.'),
  facultyId: z.string().uuid('Invalid facultyId format.'),
});

// Schema for all faculty performance (new)
const allFacultyPerformanceParamsSchema = z.object({
  academicYearId: z.string().uuid('Invalid academicYearId format.'),
});

// Helper function to parse responseValue into a number
const parseResponseValueToScore = (rawResponseValue: any): number | null => {
  let score: number | null = null;

  if (typeof rawResponseValue === 'string') {
    // Case 1: The JSON value is a direct string number (e.g., "6")
    const parsedFloat = parseFloat(rawResponseValue);
    if (!isNaN(parsedFloat)) {
      score = parsedFloat;
    } else {
      // If it's a string but not a direct number, try parsing as JSON object/number
      try {
        const parsedJson = JSON.parse(rawResponseValue);
        if (
          typeof parsedJson === 'object' &&
          parsedJson !== null &&
          'score' in parsedJson &&
          typeof (parsedJson as any).score === 'number'
        ) {
          score = (parsedJson as any).score;
        } else if (typeof parsedJson === 'number') {
          score = parsedJson;
        }
      } catch (e) {
        // console.warn(`Could not parse rawResponseValue as JSON string: ${rawResponseValue}`);
      }
    }
  }
  // Case 2: The JSON value is already a JS object (e.g., { "score": 5 })
  else if (
    typeof rawResponseValue === 'object' &&
    rawResponseValue !== null &&
    'score' in rawResponseValue &&
    typeof (rawResponseValue as any).score === 'number'
  ) {
    score = (rawResponseValue as any).score;
  }
  // Case 3: The JSON value is already a direct number
  else if (typeof rawResponseValue === 'number') {
    score = rawResponseValue;
  }

  return typeof score === 'number' && !isNaN(score) ? score : null;
};

// Existing: getFacultyPerformanceYearData for a single faculty
export const getFacultyPerformanceYearData = async (
  req: Request,
  res: Response
) => {
  try {
    const { academicYearId, facultyId } = facultyPerformanceParamsSchema.parse(
      req.params
    );

    const feedbackSnapshots = await prisma.feedbackSnapshot.findMany({
      where: {
        facultyId: facultyId,
        academicYearId: academicYearId,
        questionType: 'rating',
        formDeleted: false,
        isDeleted: false,
      },
      select: {
        id: true,
        semesterNumber: true,
        responseValue: true,
        facultyName: true,
        academicYearString: true,
      },
      orderBy: {
        semesterNumber: 'asc',
      },
    });

    if (feedbackSnapshots.length === 0) {
      const firstSnapshot = await prisma.feedbackSnapshot.findFirst({
        where: {
          facultyId: facultyId,
          academicYearId: academicYearId,
        },
        select: {
          facultyName: true,
          academicYearString: true,
        },
      });

      const defaultFacultyName =
        firstSnapshot?.facultyName || 'Unknown Faculty';
      const defaultAcademicYear =
        firstSnapshot?.academicYearString || 'Unknown Academic Year';

      const result: { [key: string]: string | number | null } = {
        Faculty_name: defaultFacultyName,
        academic_year: defaultAcademicYear,
        total_average: null,
      };
      for (let i = 1; i <= 8; i++) {
        result[`semester ${i}`] = null;
      }
      return res.status(200).json(result);
    }

    const facultyName = feedbackSnapshots[0].facultyName;
    const academicYear = feedbackSnapshots[0].academicYearString;

    const semesterScores: { [key: number]: { sum: number; count: number } } =
      {};
    let totalSum = 0;
    let totalCount = 0;
    const maxSemesterNumber = 8;

    for (const snapshot of feedbackSnapshots) {
      const semester = snapshot.semesterNumber;
      const score = parseResponseValueToScore(snapshot.responseValue); // Use the helper

      if (typeof score === 'number' && !isNaN(score)) {
        if (!semesterScores[semester]) {
          semesterScores[semester] = { sum: 0, count: 0 };
        }
        semesterScores[semester].sum += score;
        semesterScores[semester].count += 1;

        totalSum += score;
        totalCount += 1;
      } else {
        console.warn(
          `Skipping snapshot ID: ${snapshot.id} due to non-numerical or unparsable score. Raw value:`,
          snapshot.responseValue
        );
      }
    }

    const result: { [key: string]: string | number | null } = {
      Faculty_name: facultyName,
      academic_year: academicYear,
    };

    for (let i = 1; i <= maxSemesterNumber; i++) {
      if (semesterScores[i] && semesterScores[i].count > 0) {
        result[`semester ${i}`] = parseFloat(
          (semesterScores[i].sum / semesterScores[i].count).toFixed(2)
        );
      } else {
        result[`semester ${i}`] = null;
      }
    }

    result.total_average =
      totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : null;

    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error in getFacultyPerformanceYearData:', error);
    res.status(500).json({
      message:
        'An unexpected error occurred while fetching faculty performance data.',
    });
  }
};

// NEW FUNCTION: getAllFacultyPerformanceData
export const getAllFacultyPerformanceData = async (
  req: Request,
  res: Response
) => {
  try {
    // 1. Validate Input Parameters
    const { academicYearId } = allFacultyPerformanceParamsSchema.parse(
      req.params
    );

    // 2. Fetch Relevant Feedback Snapshots for the academic year
    // Select all necessary fields for aggregation
    const feedbackSnapshots = await prisma.feedbackSnapshot.findMany({
      where: {
        academicYearId: academicYearId,
        questionType: 'rating',
        formDeleted: false,
        isDeleted: false,
      },
      select: {
        id: true,
        facultyId: true,
        facultyName: true,
        semesterNumber: true,
        responseValue: true,
        academicYearString: true,
      },
      orderBy: [
        { facultyId: 'asc' }, // Order by faculty for easier grouping
        { semesterNumber: 'asc' },
      ],
    });

    // Handle case where no feedback is found for the academic year
    if (feedbackSnapshots.length === 0) {
      // Attempt to get academic year string even if no snapshots
      const academicYearString = await prisma.feedbackSnapshot.findFirst({
        where: { academicYearId: academicYearId },
        select: { academicYearString: true },
      });
      const defaultAcademicYear =
        academicYearString?.academicYearString || 'Unknown Academic Year';

      return res.status(200).json({
        academic_year: defaultAcademicYear,
        faculties: [], // Return an empty array of faculties
      });
    }

    // 3. Process and Consolidate Scores by Faculty and Semester
    interface FacultyAggregatedData {
      facultyId: string;
      Faculty_name: string;
      academic_year: string;
      semesters: { [key: number]: { sum: number; count: number } };
      totalSum: number;
      totalCount: number;
    }

    const aggregatedData: { [facultyId: string]: FacultyAggregatedData } = {};
    const maxSemesterNumber = 8; // Define the maximum possible semester number

    for (const snapshot of feedbackSnapshots) {
      const facultyId = snapshot.facultyId;
      const semester = snapshot.semesterNumber;
      const score = parseResponseValueToScore(snapshot.responseValue); // Use the helper

      // Initialize faculty data if not already present
      if (!aggregatedData[facultyId]) {
        aggregatedData[facultyId] = {
          facultyId: facultyId,
          Faculty_name: snapshot.facultyName,
          academic_year: snapshot.academicYearString,
          semesters: {},
          totalSum: 0,
          totalCount: 0,
        };
      }

      if (typeof score === 'number' && !isNaN(score)) {
        if (!aggregatedData[facultyId].semesters[semester]) {
          aggregatedData[facultyId].semesters[semester] = { sum: 0, count: 0 };
        }
        aggregatedData[facultyId].semesters[semester].sum += score;
        aggregatedData[facultyId].semesters[semester].count += 1;

        aggregatedData[facultyId].totalSum += score;
        aggregatedData[facultyId].totalCount += 1;
      } else {
        // console.warn(`Skipping score for snapshot ${snapshot.id} due to invalid value:`, snapshot.responseValue);
      }
    }

    // 4. Calculate Averages and Format Final Result
    const finalResult: any[] = []; // Array to hold results for each faculty

    for (const facultyId in aggregatedData) {
      const facultyData = aggregatedData[facultyId];
      const facultyOutput: { [key: string]: string | number | null } = {
        facultyId: facultyData.facultyId, // Include facultyId for identification
        Faculty_name: facultyData.Faculty_name,
        academic_year: facultyData.academic_year,
      };

      for (let i = 1; i <= maxSemesterNumber; i++) {
        if (facultyData.semesters[i] && facultyData.semesters[i].count > 0) {
          facultyOutput[`semester ${i}`] = parseFloat(
            (
              facultyData.semesters[i].sum / facultyData.semesters[i].count
            ).toFixed(2)
          );
        } else {
          facultyOutput[`semester ${i}`] = null;
        }
      }

      facultyOutput.total_average =
        facultyData.totalCount > 0
          ? parseFloat(
              (facultyData.totalSum / facultyData.totalCount).toFixed(2)
            )
          : null;

      finalResult.push(facultyOutput);
    }

    // 5. Send the Response
    res.status(200).json(finalResult);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error in getAllFacultyPerformanceData:', error);
    res.status(500).json({
      message:
        'An unexpected error occurred while fetching all faculty performance data.',
    });
  }
};
