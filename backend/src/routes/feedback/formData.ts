import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
      },
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

router.get('/semester/:departmentId', async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({
      where: {
        departmentId: req.params.departmentId,
      },
      select: {
        id: true,
        semesterNumber: true,
        academicYear: true,
      },
    });
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

router.get('/divisions/:departmentId/:semesterId', async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      where: {
        departmentId: req.params.departmentId,
        semesterId: req.params.semesterId,
      },
      select: {
        id: true,
        divisionName: true,
        studentCount: true,
      },
    });
    res.json(divisions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

export default router;
