import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import the singleton Prisma client

/**
 * @description Creates a new academic year.
 * @route POST /api/academic-years
 * @param {Request} req - Express Request object (expects { yearString: string, startDate?: string, endDate?: string })
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const createAcademicYear = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { yearString, startDate, endDate } = req.body;

  if (!yearString) {
    res.status(400).json({ message: 'Academic year string is required.' });
    return;
  }

  try {
    const academicYear = await prisma.academicYear.create({
      data: {
        yearString: yearString,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });
    res.status(201).json({
      message: 'Academic year created successfully.',
      academicYear: academicYear,
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('year_string')) {
      res
        .status(409)
        .json({
          message: 'Academic year with this year string already exists.',
        });
    } else {
      console.error('Error creating academic year:', error);
      res
        .status(500)
        .json({
          message: 'Failed to create academic year.',
          error: error.message,
        });
    }
  }
};

/**
 * @description Retrieves all academic years.
 * @route GET /api/academic-years
 * @param {Request} req - Express Request object
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const getAllAcademicYears = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        yearString: 'desc', // Order by year string descending (e.g., 2025-2026, 2024-2025)
      },
    });
    res.status(200).json({ academicYears: academicYears });
  } catch (error: any) {
    console.error('Error fetching academic years:', error);
    res
      .status(500)
      .json({
        message: 'Failed to retrieve academic years.',
        error: error.message,
      });
  }
};

/**
 * @description Retrieves a single academic year by ID.
 * @route GET /api/academic-years/:id
 * @param {Request} req - Express Request object (expects id in params)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const getAcademicYearById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: id },
    });

    if (!academicYear) {
      res.status(404).json({ message: 'Academic year not found.' });
      return;
    }
    res.status(200).json({ academicYear: academicYear });
  } catch (error: any) {
    console.error('Error fetching academic year by ID:', error);
    res
      .status(500)
      .json({
        message: 'Failed to retrieve academic year.',
        error: error.message,
      });
  }
};

/**
 * @description Updates an existing academic year.
 * @route PUT /api/academic-years/:id
 * @param {Request} req - Express Request object (expects id in params, { yearString?: string, startDate?: string, endDate?: string } in body)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const updateAcademicYear = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { yearString, startDate, endDate } = req.body;

  if (!yearString && !startDate && !endDate) {
    res.status(400).json({ message: 'No update data provided.' });
    return;
  }

  try {
    const academicYear = await prisma.academicYear.update({
      where: { id: id },
      data: {
        yearString: yearString,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });
    res.status(200).json({
      message: 'Academic year updated successfully.',
      academicYear: academicYear,
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('year_string')) {
      res
        .status(409)
        .json({
          message: 'Academic year with this year string already exists.',
        });
    } else if (error.code === 'P2025') {
      res.status(404).json({ message: 'Academic year not found for update.' });
    } else {
      console.error('Error updating academic year:', error);
      res
        .status(500)
        .json({
          message: 'Failed to update academic year.',
          error: error.message,
        });
    }
  }
};

/**
 * @description Deletes an academic year.
 * @route DELETE /api/academic-years/:id
 * @param {Request} req - Express Request object (expects id in params)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const deleteAcademicYear = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    // Check for dependent records before deleting (Prisma's onDelete: Restrict will handle this,
    // but a user-friendly message might be better if you check manually first)
    const dependentSemesters = await prisma.semester.count({
      where: { academicYearId: id },
    });
    const dependentStudents = await prisma.student.count({
      where: { academicYearId: id },
    });
    const dependentAllocations = await prisma.subjectAllocation.count({
      where: { academicYearId: id },
    });
    const dependentAnalytics = await prisma.feedbackAnalytics.count({
      where: { academicYearId: id },
    });

    if (
      dependentSemesters > 0 ||
      dependentStudents > 0 ||
      dependentAllocations > 0 ||
      dependentAnalytics > 0
    ) {
      res.status(409).json({
        message:
          'Cannot delete academic year: It has associated semesters, students, subject allocations, or analytics data. Please delete those first.',
      });
      return;
    }

    await prisma.academicYear.delete({
      where: { id: id },
    });
    res.status(200).json({ message: 'Academic year deleted successfully.' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res
        .status(404)
        .json({ message: 'Academic year not found for deletion.' });
    } else {
      console.error('Error deleting academic year:', error);
      res
        .status(500)
        .json({
          message: 'Failed to delete academic year.',
          error: error.message,
        });
    }
  }
};
