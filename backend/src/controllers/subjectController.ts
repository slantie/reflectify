import { PrismaClient, SubjectType } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const subjectCache = new Map();
const COLLEGE_ID = 'LDRP-ITR';
const departmentCache = new Map();
const semesterCache = new Map();
const collegeCache = new Map();

interface SubjectData {
  name: string;
  abbreviation: string;
  subjectCode: string;
  type: SubjectType;
  departmentId: string;
  semesterId: string;
}

async function ensureCollege() {
  let college = collegeCache.get(COLLEGE_ID);
  if (!college) {
    college = await prisma.college.upsert({
      where: { id: COLLEGE_ID },
      create: {
        id: COLLEGE_ID,
        name: 'LDRP Institute of Technology and Research',
        websiteUrl: 'https://ldrp.ac.in',
        address: 'Sector 15, Gandhinagar, Gujarat',
        contactNumber: '+91-79-23241492',
        logo: 'ldrp-logo.png',
        images: {},
      },
      update: {},
    });
    collegeCache.set(COLLEGE_ID, college);
  }
  return college;
}

export const getSubjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        department: true,
        semester: true,
        allocations: true,
      },
    });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subjects' });
  }
};

export const createSubject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, abbreviation, subjectCode, type, departmentId, semesterId } =
      req.body;
    const semesterNumber = parseInt(semesterId); // Convert to number since we receive semester number
    const currentYear = new Date().getFullYear().toString();

    let department = departmentCache.get(departmentId);
    if (!department) {
      const college = await ensureCollege();
      department = await prisma.department.upsert({
        where: {
          id: departmentId,
        },
        create: {
          name: 'Computer Engineering',
          abbreviation: 'CE',
          hodName: `HOD of Computer Engineering`,
          hodEmail: `hod.ce@ldrp.ac.in`,
          collegeId: college.id,
        },
        update: {},
      });
      departmentCache.set(departmentId, department);
    }

    // Find existing semester by department and semester number
    let semester = await prisma.semester.findFirst({
      where: {
        departmentId: department.id,
        semesterNumber: semesterNumber,
      },
    });

    // Create semester if it doesn't exist
    if (!semester) {
      semester = await prisma.semester.create({
        data: {
          departmentId: department.id,
          semesterNumber: semesterNumber,
          academicYear: currentYear,
        },
      });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        abbreviation,
        subjectCode,
        type,
        departmentId: department.id,
        semesterId: semester.id,
      },
      include: {
        department: true,
        semester: true,
        allocations: true,
      },
    });

    res.status(201).json({
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating subject', details: error });
  } finally {
    departmentCache.clear();
    semesterCache.clear();
    collegeCache.clear();
  }
};

export const getSubjectsBySemester = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId } = req.params;
    const subjects = await prisma.subject.findMany({
      where: {
        semesterId: semesterId,
      },
      include: {
        department: true,
        semester: true,
        allocations: true,
      },
    });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subjects by semester' });
  }
};

export const getSubjectById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: true,
        semester: true,
        allocations: true,
      },
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subject details' });
  }
};

export const updateSubject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const subject = await prisma.$transaction(async (prisma) => {
      const result = await prisma.subject.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          semester: true,
          allocations: true,
        },
      });
      return result;
    });

    res.status(200).json({
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating subject' });
  }
};

export const deleteSubject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (prisma) => {
      await prisma.subject.delete({
        where: { id },
      });
    });

    res.status(200).json({
      message: 'Subject deleted successfully',
      id: id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting subject' });
  }
};

export const batchCreateSubjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subjects = req.body.subjects;
    const results = [];

    for (const sub of subjects) {
      const subject = await prisma.subject.upsert({
        where: {
          departmentId_abbreviation: {
            departmentId: sub.departmentId,
            abbreviation: sub.abbreviation,
          },
        },
        create: {
          name: sub.name,
          abbreviation: sub.abbreviation,
          subjectCode: sub.subjectCode,
          type: sub.type || 'MANDATORY',
          departmentId: sub.departmentId,
          semesterId: sub.semesterId,
        },
        update: {},
      });
      results.push(subject);
    }

    res.status(201).json({
      message: 'Subjects batch created successfully',
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error in batch creating subjects' });
  }
};

export const getSubjectAbbreviations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deptAbbr = req.params.deptAbbr?.trim().toUpperCase() || null;

    // No department abbreviation -> fetch all subject abbreviations
    if (!deptAbbr) {
      const allSubjects = await prisma.subject.findMany({
        where: { department: { collegeId: 'LDRP-ITR' } },
        select: { abbreviation: true },
      });

      const allAbbrs = allSubjects.map((f) => f.abbreviation);
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

export const getAllSubjectAbbreviations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        department: {
          collegeId: 'LDRP-ITR',
        },
      },
      select: {
        abbreviation: true,
      },
    });

    const abbreviations = subjects.map((subject) => subject.abbreviation);
    res.status(200).json(abbreviations);
  } catch (error) {
    console.error('❌ Error fetching all subject abbreviations:', error);
    res.status(500).json({ error: 'Failed to fetch subject abbreviations' });
  }
};
