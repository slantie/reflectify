import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', async (req, res) => {
  try {
    const [
      facultyCount,
      studentCount,
      departmentCount,
      divisionCount,
      subjectCount,
      semesterCount,
    ] = await Promise.all([
      prisma.faculty.count(),
      prisma.student.count(),
      prisma.department.count(),
      prisma.division.count(),
      prisma.subject.count(),
      prisma.semester.count(),
    ]);

    res.json({
      facultyCount,
      studentCount,
      departmentCount,
      divisionCount,
      subjectCount,
      semesterCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

router.post('/createfaculty', async (req, res) => {
  try {
    const existingFaculty = await prisma.faculty.findFirst({
      where: {
        email: req.body.email,
      },
    });

    if (!existingFaculty) {
      const faculty = await prisma.faculty.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          designation: req.body.designation,
          seatingLocation: req.body.seatingLocation,
          abbreviation: req.body.abbreviation,
          departmentId: req.body.departmentId,
          joiningDate: new Date(),
        },
        include: {
          department: true,
        },
      });
      res.status(201).json(faculty);
    } else {
      res.status(409).json({
        error: `${req.body.email} already exists in the database`,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

router.get('/faculty', async (req, res) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        department: true,
      },
    });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faculty data' });
  }
});

router.put('/faculty/:id', async (req, res) => {
  try {
    const { joiningDate, ...otherData } = req.body;

    const faculty = await prisma.faculty.update({
      where: { id: req.params.id },
      data: {
        ...otherData,
        joiningDate: new Date(joiningDate).toISOString(),
      },
      include: {
        department: true,
      },
    });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

router.delete('/faculty/:id', async (req, res) => {
  try {
    await prisma.faculty.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

router.get('/student', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        department: true,
        semester: true,
        division: true,
      },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student data' });
  }
});

router.put('/student/:id', async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

router.delete('/student/:id', async (req, res) => {
  try {
    await prisma.student.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

router.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get all departments with college info
router.get('/department', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            faculties: true,
            students: true,
          },
        },
      },
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Create department
router.post('/department', async (req, res) => {
  try {
    const department = await prisma.department.create({
      data: {
        name: req.body.name,
        abbreviation: req.body.abbreviation,
        hodName: req.body.hodName,
        hodEmail: req.body.hodEmail,
        collegeId: req.body.collegeId,
      },
      include: {
        college: true,
      },
    });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/department/:id', async (req, res) => {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        college: true,
      },
    });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/department/:id', async (req, res) => {
  try {
    await prisma.department.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;
