import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const studentCache = new Map();

interface StudentData {
  name: string;
  enrollmentNumber: string;
  email: string;
  phoneNumber: string;
  academicYear: string;
  batch: string;
  departmentName: string;
  semesterId: string;
  divisionId: string;
  image?: string;
}

export const getStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await prisma.student.findMany({
      include: {
        department: true,
        semester: true, 
        division: true,
      },
    });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching students',
    });
  }
};

export const createStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const studentData: StudentData = req.body;
    const studentKey = studentData.enrollmentNumber;

    const college = await prisma.college.findUnique({
      where: {
        name: 'LDRP Institute of Technology and Research',
      },
    });

    if (!college) {
      throw new Error('College not found');
    }

    let student = studentCache.get(studentKey);

    if (!student) {
      student = await prisma.student.upsert({
        where: { enrollmentNumber: studentData.enrollmentNumber },
        create: {
          name: studentData.name,
          enrollmentNumber: studentData.enrollmentNumber,
          email: studentData.email,
          phoneNumber: studentData.phoneNumber,
          academicYear: studentData.academicYear,
          batch: studentData.batch,
          department: {
            connect: {
              name_collegeId: {
                name: studentData.departmentName,
                collegeId: college.id,
              },
            },
          },
          semester: {
            connect: {
              id: studentData.semesterId,
            },
          },
          division: {
            connect: {
              id: studentData.divisionId,
            },
          },
          image: studentData.image,
        },
        update: {},
        include: {
          department: {
            include: {
              college: true,
            },
          },
          semester: true,
          division: true,
        },
      });

      studentCache.set(studentKey, student);
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error) {
    console.error('Student creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating student',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    studentCache.clear();
  }
};

export const getStudentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            college: true,
          },
        },
        semester: true,
        division: true,
        responses: true,
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching student details',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await prisma.$transaction(async (prisma) => {
      const result = await prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          department: {
            include: {
              college: true,
            },
          },
          semester: true,
          division: true,
        },
      });
      return result;
    });

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating student',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (prisma) => {
      await prisma.student.delete({
        where: { id },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      id: id,
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting student',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const batchCreateStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = req.body.students;
    const results = [];

    const college = await prisma.college.findUnique({
      where: {
        name: 'LDRP Institute of Technology and Research',
      },
    });

    if (!college) {
      throw new Error('College not found');
    }

    for (const std of students) {
      const student = await prisma.student.upsert({
        where: { enrollmentNumber: std.enrollmentNumber },
        create: {
          name: std.name,
          enrollmentNumber: std.enrollmentNumber,
          email: std.email,
          phoneNumber: std.phoneNumber,
          academicYear: std.academicYear,
          batch: std.batch,
          department: {
            connect: {
              name_collegeId: {
                name: std.departmentName,
                collegeId: college.id,
              },
            },
          },
          semester: {
            connect: {
              id: std.semesterId,
            },
          },
          division: {
            connect: {
              id: std.divisionId,
            },
          },
          image: std.image,
        },
        update: {},
        include: {
          department: {
            include: {
              college: true,
            },
          },
          semester: true,
          division: true,
        },
      });
      results.push(student);
    }

    res.status(201).json({
      success: true,
      message: 'Students batch created successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error in batch creating students:', error);
    res.status(500).json({
      success: false,
      error: 'Error in batch creating students',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
