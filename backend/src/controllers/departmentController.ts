import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const departmentCache = new Map();

interface DepartmentData {
  name: string;
  abbreviation: string;
  hodName: string;
  hodEmail: string;
  collegeId: string;
}

export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        college: true,
        semesters: true,
        faculties: true,
        subjects: true,
        students: true,
        Division: true,
      },
    });
    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching departments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, abbreviation } = req.body;
    const deptKey = `${name}`;

    const college = await prisma.college.upsert({
      where: {
        name: 'LDRP Institute of Technology and Research',
      },
      create: {
        name: 'LDRP Institute of Technology and Research',
        websiteUrl: 'https://www.ldrp.ac.in',
        address: 'Gandhinagar, Gujarat',
        contactNumber: '079-23241492',
        logo: '/images/ldrp-logo.png',
        images: {},
      },
      update: {},
    });

    let department = departmentCache.get(deptKey);

    if (!department) {
      department = await prisma.department.upsert({
        where: {
          name_collegeId: {
            name: name,
            collegeId: college.id,
          },
        },
        create: {
          name: name,
          abbreviation: abbreviation || name,
          hodName: `HOD of ${name}`,
          hodEmail: `hod.${name.toLowerCase()}@ldrp.ac.in`,
          collegeId: college.id,
        },
        update: {},
        include: {
          college: true,
          semesters: true,
          faculties: true,
          subjects: true,
          Division: true,
        },
      });

      departmentCache.set(deptKey, department);
    }

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    console.error('Department creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating department',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        college: true,
        semesters: true,
        faculties: true,
        subjects: true,
        students: true,
        Division: true,
      },
    });

    if (!department) {
      res.status(404).json({
        success: false,
        error: 'Department not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching department details',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const department = await prisma.$transaction(async (prisma) => {
      const result = await prisma.department.update({
        where: { id },
        data: updateData,
        include: {
          college: true,
          semesters: true,
          faculties: true,
          subjects: true,
          Division: true,
        },
      });
      return result;
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating department',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (prisma) => {
      await prisma.department.delete({
        where: { id },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      id: id,
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting department',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const batchCreateDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departments = req.body.departments;
    const results = [];

    const college = await prisma.college.upsert({
      where: {
        name: 'LDRP Institute of Technology and Research',
      },
      create: {
        name: 'LDRP Institute of Technology and Research',
        websiteUrl: 'https://www.ldrp.ac.in',
        address: 'Gandhinagar, Gujarat',
        contactNumber: '079-23241492',
        logo: '/images/ldrp-logo.png',
        images: {},
      },
      update: {},
    });

    for (const dept of departments) {
      const department = await prisma.department.upsert({
        where: {
          name_collegeId: {
            name: dept.name,
            collegeId: college.id,
          },
        },
        create: {
          name: dept.name,
          abbreviation: dept.abbreviation || dept.name,
          hodName: dept.hodName || `HOD of ${dept.name}`,
          hodEmail:
            dept.hodEmail || `hod.${dept.name.toLowerCase()}@ldrp.ac.in`,
          collegeId: college.id,
        },
        update: {},
        include: {
          college: true,
          semesters: true,
          faculties: true,
          subjects: true,
          Division: true,
        },
      });
      results.push(department);
    }

    res.status(201).json({
      success: true,
      message: 'Departments batch created successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error in batch creating departments:', error);
    res.status(500).json({
      success: false,
      error: 'Error in batch creating departments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
