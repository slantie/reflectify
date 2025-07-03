import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const facultyCache = new Map();

interface FacultyData {
  name: string;
  abbreviation: string;
  email: string;
  designation: string;
  seatingLocation: string;
  image?: string;
  joiningDate: Date;
  departmentId: string;
}

interface getFacultyAbbreviations {
  id: string;
  name: string;
  abbreviation: string;
}

export const getFaculties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        department: true,
        mentoredDivisions: true,
        allocations: true,
      },
    });
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching faculties' });
  }
};

export const createFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const facultyData: FacultyData = req.body;
    const facultyKey = facultyData.abbreviation;

    let faculty = facultyCache.get(facultyKey);

    if (!faculty) {
      faculty = await prisma.faculty.upsert({
        where: { abbreviation: facultyData.abbreviation },
        create: {
          name: facultyData.name,
          abbreviation: facultyData.abbreviation,
          email: facultyData.email,
          designation: facultyData.designation || 'Assistant Professor',
          seatingLocation: facultyData.seatingLocation,
          image: facultyData.image,
          joiningDate: facultyData.joiningDate || new Date(),
          departmentId: facultyData.departmentId,
        },
        update: {},
        include: {
          department: true,
          mentoredDivisions: true,
          allocations: true,
        },
      });

      facultyCache.set(facultyKey, faculty);
    }

    res.status(201).json({
      message: 'Faculty created/updated successfully',
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating/updating faculty' });
  } finally {
    facultyCache.clear();
  }
};

export const getFacultyById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        department: true,
        mentoredDivisions: true,
        allocations: true,
      },
    });

    if (!faculty) {
      res.status(404).json({ error: 'Faculty not found' });
      return;
    }

    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching faculty details' });
  }
};

export const updateFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const faculty = await prisma.$transaction(async (prisma) => {
      const result = await prisma.faculty.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          mentoredDivisions: true,
          allocations: true,
        },
      });
      return result;
    });

    res.status(200).json({
      message: 'Faculty updated successfully',
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating faculty' });
  }
};

export const deleteFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (prisma) => {
      await prisma.faculty.delete({
        where: { id },
      });
    });

    res.status(200).json({
      message: 'Faculty deleted successfully',
      id: id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting faculty' });
  }
};

export const batchCreateFaculties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const faculties = req.body.faculties;
    const results = [];

    for (const fac of faculties) {
      const faculty = await prisma.faculty.upsert({
        where: { abbreviation: fac.abbreviation },
        create: {
          name: fac.name,
          abbreviation: fac.abbreviation,
          email: fac.email,
          designation: fac.designation || 'Assistant Professor',
          seatingLocation: fac.seatingLocation,
          image: fac.image,
          joiningDate: fac.joiningDate || new Date(),
          departmentId: fac.departmentId,
        },
        update: {},
      });
      results.push(faculty);
    }

    res.status(201).json({
      message: 'Faculties batch created successfully',
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error in batch creating faculties' });
  }
};

export const getFacultyAbbreviations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deptAbbr = req.params.deptAbbr?.trim().toUpperCase() || null;

    // No department abbreviation -> fetch all faculty abbreviations
    if (!deptAbbr) {
      const allFaculties = await prisma.faculty.findMany({
        where: { department: { collegeId: 'LDRP-ITR' } },
        select: { abbreviation: true },
      });

      const allAbbrs = allFaculties.map((f) => f.abbreviation);
      res.status(200).json(allAbbrs);
      return;
    }

    // Department-specific lookup
    const department = await prisma.department.findFirst({
      where: {
        abbreviation: deptAbbr,
        collegeId: 'LDRP-ITR',
      },
    });

    if (!department) {
      res.status(404).json({ error: `Department "${deptAbbr}" not found` });
      return;
    }

    const faculties = await prisma.faculty.findMany({
      where: { departmentId: department.id },
      select: { abbreviation: true },
    });

    if (!faculties.length) {
      res.status(404).json({ error: 'No faculties found for this department' });
      return;
    }

    const deptAbbrs = faculties.map((f) => f.abbreviation);
    res.status(200).json(deptAbbrs);
  } catch (error) {
    console.error('❌ Error in getFacultyAbbreviations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllFacultyAbbreviations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const faculties = await prisma.faculty.findMany({
      where: {
        department: {
          collegeId: 'LDRP-ITR',
        },
      },
      select: {
        abbreviation: true,
      },
    });

    const abbreviations = faculties.map((faculty) => faculty.abbreviation);
    res.status(200).json(abbreviations);
  } catch (error) {
    console.error('❌ Error fetching all faculty abbreviations:', error);
    res.status(500).json({ error: 'Failed to fetch faculty abbreviations' });
  }
};
