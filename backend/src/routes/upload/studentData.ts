import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const COLLEGE_ID = 'LDRP-ITR';
const collegeCache = new Map();
const departmentCache = new Map();
const studentCache = new Map();
const semesterCache = new Map();
const divisionCache = new Map();

interface deptartmentdata {
  actualName: string;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

const getCellValue = (cell: ExcelJS.Cell): string => {
  const value = cell.value;
  if (
    value &&
    typeof value === 'object' &&
    'hyperlink' in value &&
    'text' in value
  ) {
    return value.text || '';
  }
  return value?.toString() || '';
};

router.post(
  '/',
  upload.single('studentData'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        res.status(400).json({ message: 'Invalid worksheet' });
        return;
      }

      const start_time = Date.now();

      const processedRows = [];
      const currentYear = new Date().getFullYear().toString();

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const deptName = row.getCell(4).value?.toString() || '';
        const semesterNumber = row.getCell(5).value?.toString() || '';
        const divisionName = row.getCell(6).value?.toString() || '';

        let department = departmentCache.get(deptName);
        if (!department) {
          const college = await ensureCollege();

          let departmentName = deptName;
          if (deptName === 'CE') {
            departmentName = 'Computer Engineering';
          } else if (deptName === 'IT') {
            departmentName = 'Information Technology';
          }

          department = await prisma.department.upsert({
            where: {
              name_collegeId: {
                name: departmentName,
                collegeId: college.id,
              },
            },
            create: {
              name: departmentName,
              abbreviation: deptName,
              hodName: `HOD of ${departmentName}`,
              hodEmail: `hod.${deptName.toLowerCase()}@ldrp.ac.in`,
              collegeId: college.id,
            },
            update: {},
          });
          departmentCache.set(deptName, department);
        }

        const semesterKey = `${department.id}_${semesterNumber}_${currentYear}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              departmentId_semesterNumber: {
                departmentId: department.id,
                semesterNumber: parseInt(semesterNumber),
              },
            },
            create: {
              departmentId: department.id,
              semesterNumber: parseInt(semesterNumber),
              academicYear: currentYear,
            },
            update: {},
          });
          semesterCache.set(semesterKey, semester);
        }

        const divisionKey = `${department.id}_${divisionName}_${semester.id}`;
        let division = divisionCache.get(divisionKey);
        if (!division) {
          division = await prisma.division.upsert({
            where: {
              departmentId_divisionName_semesterId: {
                departmentId: department.id,
                divisionName: divisionName,
                semesterId: semester.id,
              },
            },
            create: {
              departmentId: department.id,
              semesterId: semester.id,
              divisionName: divisionName,
              studentCount: 0,
            },
            update: {},
          });
          divisionCache.set(divisionKey, division);
        }

        const student = await prisma.student.upsert({
          where: { enrollmentNumber: getCellValue(row.getCell(3)) },
          create: {
            name: getCellValue(row.getCell(2)),
            enrollmentNumber: getCellValue(row.getCell(3)),
            email: getCellValue(row.getCell(8)),
            phoneNumber: getCellValue(row.getCell(8)),
            academicYear: currentYear,
            batch: getCellValue(row.getCell(7)),
            departmentId: department.id,
            semesterId: semester.id,
            divisionId: division.id,
          },
          update: {},
        });

        processedRows.push(student);
      }

      const end_time = Date.now();
      console.log(
        '🕒 Student data processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );

      res.status(200).json({
        message: 'Student data updated successfully',
        count: processedRows.length,
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        message: 'Error processing student data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      departmentCache.clear();
      semesterCache.clear();
      divisionCache.clear();
      collegeCache.clear();
    }
  }
);

export default router;
