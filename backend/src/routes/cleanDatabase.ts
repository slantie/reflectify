import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

/**
 * @route   DELETE /api/clean-database
 * @desc    Cleans all database tables in correct dependency order
 * @access  Protected - Super Admin only
 */
router.delete('/', async (req, res) => {
  try {
    // Delete in order of dependencies
    await prisma.$transaction([
      prisma.studentResponse.deleteMany(),
      prisma.feedbackQuestion.deleteMany(),
      prisma.feedbackForm.deleteMany(),
      prisma.feedbackAnalytics.deleteMany(),
      prisma.subjectAllocation.deleteMany(),
      prisma.student.deleteMany(),
      prisma.faculty.deleteMany(),
      prisma.subject.deleteMany(),
      prisma.division.deleteMany(),
      prisma.semester.deleteMany(),
      prisma.department.deleteMany(),
      prisma.college.deleteMany(),
      prisma.analyticsView.deleteMany(),
      prisma.customReport.deleteMany(),
      prisma.questionCategory.deleteMany(),
      prisma.academicYear.deleteMany(),
    ]);

    console.log('🗑️ Database cleaned successfully');

    res.status(200).json({
      message: 'Database cleaned successfully',
      status: 'success',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error cleaning database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
