import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const semesterCache = new Map();

interface SemesterData {
  departmentId: string;
  semesterNumber: number;
  academicYear: string;
}

export const getSemesters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId } = req.query;
    const semesters = await prisma.semester.findMany({
      where: {
        departmentId: departmentId as string,
      },
      include: {
        department: true,
      },
    });
    res.status(200).json(semesters);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching semesters' });
  }
};

export const createSemester = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { departmentId, semesterNumber, academicYear } = req.body;
    const semesterKey = `${departmentId}_${semesterNumber}_${academicYear}`;

    let semester = semesterCache.get(semesterKey);

    if (!semester) {
      semester = await prisma.semester.upsert({
        where: {
          departmentId_semesterNumber: {
            departmentId,
            semesterNumber: parseInt(semesterNumber),
          },
        },
        create: {
          departmentId,
          semesterNumber: parseInt(semesterNumber),
          academicYear,
        },
        update: {
          academicYear,
        },
        include: {
          divisions: true,
          subjects: true,
          students: true,
        },
      });

      semesterCache.set(semesterKey, semester);
    }

    res.status(201).json({
      message: 'Semester created/updated successfully',
      data: semester,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating/updating semester' });
  } finally {
    semesterCache.clear();
  }
};

export const getSemesterById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const semester = await prisma.semester.findUnique({
      where: { id },
      include: {
        department: true,
        divisions: true,
        subjects: true,
        students: true,
        allocations: true,
      },
    });

    if (!semester) {
      res.status(404).json({ error: 'Semester not found' });
      return;
    }

    res.status(200).json(semester);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching semester details' });
  }
};

export const updateSemester = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const semester = await prisma.$transaction(async (prisma) => {
      const result = await prisma.semester.update({
        where: { id },
        data: updateData,
        include: {
          divisions: true,
          subjects: true,
          students: true,
        },
      });
      return result;
    });

    res.status(200).json({
      message: 'Semester updated successfully',
      data: semester,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating semester' });
  }
};

export const deleteSemester = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (prisma) => {
      await prisma.semester.delete({
        where: { id },
      });
    });

    res.status(200).json({
      message: 'Semester deleted successfully',
      id: id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting semester' });
  }
};

export const batchCreateSemesters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const semesters = req.body.semesters;
    const results = [];

    for (const sem of semesters) {
      const semester = await prisma.semester.upsert({
        where: {
          departmentId_semesterNumber: {
            departmentId: sem.departmentId,
            semesterNumber: parseInt(sem.semesterNumber),
          },
        },
        create: {
          departmentId: sem.departmentId,
          semesterNumber: parseInt(sem.semesterNumber),
          academicYear: sem.academicYear,
        },
        update: {
          academicYear: sem.academicYear,
        },
      });
      results.push(semester);
    }

    res.status(201).json({
      message: 'Semesters batch created successfully',
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error in batch creating semesters' });
  }
};
