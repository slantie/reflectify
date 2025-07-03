import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getSemesterDivisions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const semesterDivisions = await prisma.semester.findMany({
      select: {
        id: true,
        semesterNumber: true,
        academicYear: true,
        divisions: {
          select: {
            id: true,
            divisionName: true,
            studentCount: true,
            students: {
              select: {
                responses: {
                  select: {
                    id: true,
                    value: true,
                    submittedAt: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        semesterNumber: 'asc'
      }
    });

    const formattedResponse = semesterDivisions
      .map(semester => {
        const divisionsWithResponses = semester.divisions
          .map(division => {
            const responseCount = division.students.reduce(
              (count, student) => count + student.responses.length, 
              0
            );
            return {
              divisionId: division.id,
              divisionName: division.divisionName,
              studentCount: division.studentCount,
              responseCount
            };
          })
          .filter(division => division.responseCount > 0);

        return {
          semesterId: semester.id,
          semesterNumber: semester.semesterNumber,
          academicYear: semester.academicYear,
          divisions: divisionsWithResponses
        };
      })
      .filter(semester => semester.divisions.length > 0);

    res.status(200).json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching semester divisions data'
    });
  }
};
