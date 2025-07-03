import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const COLLEGE_ID = 'LDRP-ITR';
const collegeCache = new Map();

interface CollegeData {
  name: string;
  websiteUrl: string;
  address: string;
  contactNumber: string;
  logo: string;
  images: any;
}

const defaultCollegeData: CollegeData = {
  name: 'LDRP Institute of Technology and Research',
  websiteUrl: 'https://www.ldrp.ac.in',
  address: 'Gujarat',
  contactNumber: '7923241492',
  logo: 'ldrp_logo.png',
  images: {},
};

export const getColleges = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const colleges = await prisma.college.findMany({
      include: {
        departments: {
          include: {
            semesters: true,
            Division: true,
            subjects: true,
            faculties: true,
            students: true,
          },
        },
      },
    });
    res.status(200).json(colleges);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching colleges' });
  }
};

export const createCollege = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let college = collegeCache.get(COLLEGE_ID);

    if (!college) {
      college = await prisma.college.upsert({
        where: { id: COLLEGE_ID },
        create: {
          id: COLLEGE_ID,
          ...defaultCollegeData,
        },
        update: req.body,
        include: {
          departments: true,
        },
      });
      collegeCache.set(COLLEGE_ID, college);
    }

    res.status(201).json({
      message: 'College created/updated successfully',
      data: college,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating/updating college' });
  } finally {
    collegeCache.clear();
  }
};

export const getCollegeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const college = await prisma.college.findUnique({
      where: { id: COLLEGE_ID },
      include: {
        departments: {
          include: {
            semesters: true,
            Division: true,
            subjects: true,
            faculties: true,
            students: true,
          },
        },
      },
    });

    if (!college) {
      res.status(404).json({ error: 'College not found' });
      return;
    }

    res.status(200).json(college);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching college details' });
  }
};

export const updateCollege = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const college = await prisma.$transaction(async (prisma) => {
      const result = await prisma.college.update({
        where: { id: COLLEGE_ID },
        data: req.body,
        include: {
          departments: true,
        },
      });
      return result;
    });

    res.status(200).json({
      message: 'College updated successfully',
      data: college,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating college details' });
  }
};

export const deleteCollege = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.college.delete({
        where: { id: COLLEGE_ID },
      });
    });

    res.status(200).json({
      message: 'College deleted successfully',
      id: COLLEGE_ID,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting college' });
  }
};

export const batchUpdateCollege = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const updates = req.body.updates;

    const college = await prisma.$transaction(async (prisma) => {
      const result = await prisma.college.update({
        where: { id: COLLEGE_ID },
        data: updates,
        include: {
          departments: {
            include: {
              semesters: true,
              Division: true,
              subjects: true,
              faculties: true,
              students: true,
            },
          },
        },
      });
      return result;
    });

    res.status(200).json({
      message: 'Batch update successful',
      data: college,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error in batch update' });
  }
};
