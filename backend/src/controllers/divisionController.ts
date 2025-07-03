import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const divisionCache = new Map();

interface DivisionData {
  departmentId: string;
  semesterId: string;
  divisionName: string;
  studentCount: number;
}

export const getDivisions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId, semesterId } = req.query;
    const divisions = await prisma.division.findMany({
      where: {
        departmentId: departmentId as string,
        semesterId: semesterId as string,
      },
      include: {
        department: true,
        semester: true,
        students: true, // Include students relation
      },
    });

    // Map the divisions to include calculated studentCount
    const divisionsWithCount = divisions.map((division) => ({
      ...division,
      studentCount: division.students.length,
      students: undefined, // Remove students array from response
    }));

    res.status(200).json(divisionsWithCount);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching divisions' });
  }
};

// export const getDivisions = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const divisions = await prisma.division.findMany({
//       include: {
//         department: true,
//         semester: true,
//         mentors: true,
//         students: true,
//         subjectAllocations: true,
//         feedbackForms: true,
//       },
//     });
//     res.status(200).json(divisions);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching divisions' });
//   }
// };

export const createDivision = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId, semesterId, divisionName } = req.body;
    const divisionKey = `${departmentId}_${divisionName}_${semesterId}`;

    let division = divisionCache.get(divisionKey);

    if (!division) {
      division = await prisma.division.upsert({
        where: {
          departmentId_divisionName_semesterId: {
            departmentId,
            divisionName,
            semesterId,
          },
        },
        create: {
          departmentId,
          semesterId,
          divisionName,
          studentCount: 0,
        },
        update: {},
        include: {
          department: true,
          semester: true,
          mentors: true,
          students: true,
        },
      });

      divisionCache.set(divisionKey, division);
    }

    res.status(201).json({
      message: 'Division created/updated successfully',
      data: division,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating/updating division' });
  } finally {
    divisionCache.clear();
  }
};

export const getDivisionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const division = await prisma.division.findUnique({
      where: { id },
      include: {
        department: true,
        semester: true,
        mentors: true,
        students: true,
        subjectAllocations: true,
        feedbackForms: true,
      },
    });

    if (!division) {
      res.status(404).json({ error: 'Division not found' });
      return;
    }

    res.status(200).json(division);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching division details' });
  }
};

export const updateDivision = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const division = await prisma.$transaction(async (prisma) => {
      const result = await prisma.division.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          semester: true,
          mentors: true,
          students: true,
        },
      });
      return result;
    });

    res.status(200).json({
      message: 'Division updated successfully',
      data: division,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating division' });
  }
};

export const deleteDivision = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (prisma) => {
      await prisma.division.delete({
        where: { id },
      });
    });

    res.status(200).json({
      message: 'Division deleted successfully',
      id: id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting division' });
  }
};

export const batchCreateDivisions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const divisions = req.body.divisions;
    const results = [];

    for (const div of divisions) {
      const division = await prisma.division.upsert({
        where: {
          departmentId_divisionName_semesterId: {
            departmentId: div.departmentId,
            divisionName: div.divisionName,
            semesterId: div.semesterId,
          },
        },
        create: {
          departmentId: div.departmentId,
          semesterId: div.semesterId,
          divisionName: div.divisionName,
          studentCount: div.studentCount || 0,
        },
        update: {},
      });
      results.push(division);
    }

    res.status(201).json({
      message: 'Divisions batch created successfully',
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error in batch creating divisions' });
  }
};
