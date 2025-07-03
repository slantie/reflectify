import { PrismaClient, SubjectAllocation } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getSubjectAllocations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const subjectAllocations = await prisma.subjectAllocation.findMany();
    res.json(subjectAllocations);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subject allocations' });
  }
};

export const createSubjectAllocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      facultyId,
      subjectId,
      divisionId,
      semesterId,
      lectureType,
      academicYear,
    } = req.body;

    // Validate the input
    if (
      !facultyId ||
      !subjectId ||
      !divisionId ||
      !semesterId ||
      !lectureType ||
      !academicYear
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const subjectAllocation = await prisma.subjectAllocation.create({
      data: {
        faculty: { connect: { id: facultyId } },
        subject: { connect: { id: subjectId } },
        division: { connect: { id: divisionId } },
        semester: { connect: { id: semesterId } },
        department: { connect: { id: req.body.departmentId } }, // Add department property
        lectureType,
        academicYear,
      },
    });

    res.json(subjectAllocation);
  } catch (error) {
    res.status(500).json({ error: 'Error creating subject allocation' });
  }
};

export const getSubjectAllocationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const subjectAllocation = await prisma.subjectAllocation.findUnique({
      where: { id },
    });
    if (!subjectAllocation) {
      res.status(404).json({ error: 'Subject allocation not found' });
      return;
    }
    res.json(subjectAllocation);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error fetching subject allocation details' });
  }
};

export const updateSubjectAllocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      facultyId,
      subjectId,
      divisionId,
      semesterId,
      lectureType,
      academicYear,
    } = req.body;

    // Validate the input
    if (
      !facultyId ||
      !subjectId ||
      !divisionId ||
      !semesterId ||
      !lectureType ||
      !academicYear
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const subjectAllocation = await prisma.subjectAllocation.update({
      where: { id },
      data: {
        facultyId,
        subjectId,
        divisionId,
        semesterId,
        lectureType,
        academicYear,
      },
    });

    res.json(subjectAllocation);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error updating subject allocation details' });
  }
};

export const deleteSubjectAllocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the subject allocation exists before trying to delete
    const subjectAllocation = await prisma.subjectAllocation.findUnique({
      where: { id },
    });
    if (!subjectAllocation) {
      res.status(404).json({ error: 'Subject allocation not found' });
      return;
    }

    await prisma.subjectAllocation.delete({ where: { id } });
    res.json({ message: 'Subject allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting subject allocation' });
  }
};
