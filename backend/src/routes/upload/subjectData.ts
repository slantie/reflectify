import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import express, { Request, Response, Router } from 'express';
import multer from 'multer';

const COLLEGE_ID = 'LDRP-ITR';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const departmentCache = new Map();
const subjectCache = new Map();
const semesterCache = new Map();
const collegeCache = new Map();

enum SubjectType {
  MANDATORY = 'MANDATORY',
  ELECTIVE = 'ELECTIVE',
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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
  upload.single('subjectData'),
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

      const batch = [];
      const batchSize = 500;
      const processedRows = [];
      const currentYear = new Date().getFullYear().toString();

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const deptName = row.getCell(7).value?.toString() || '';
        const semesterNumber = row.getCell(5).value?.toString() || '';

        let department = departmentCache.get(deptName);
        if (!department) {
          department = await prisma.department.findFirst({
            where: { abbreviation: deptName },
          });
          if (!department) {
            continue;
          }
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

        const subject = {
          departmentId: department.id,
          semesterId: semester.id,
          name: getCellValue(row.getCell(2)),
          abbreviation: getCellValue(row.getCell(3)),
          subjectCode: getCellValue(row.getCell(4)),
          type:
            getCellValue(row.getCell(6)).toUpperCase() === 'TRUE'
              ? SubjectType.ELECTIVE
              : SubjectType.MANDATORY,
        };

        batch.push(subject);

        if (batch.length >= batchSize) {
          for (const item of batch) {
            await prisma.subject.upsert({
              where: {
                departmentId_abbreviation: {
                  departmentId: item.departmentId,
                  abbreviation: item.abbreviation,
                },
              },
              update: item,
              create: item,
            });
          }
          batch.length = 0;
        }

        processedRows.push(subject);
      }

      if (batch.length > 0) {
        for (const item of batch) {
          await prisma.subject.upsert({
            where: {
              departmentId_abbreviation: {
                departmentId: item.departmentId,
                abbreviation: item.abbreviation,
              },
            },
            update: item,
            create: item,
          });
        }
      }

      const end_time = Date.now();
      console.log(
        '🕒 Subject data processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );

      res.status(200).json({
        message: 'Subject data updated successfully',
        count: processedRows.length,
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        message: 'Error processing subject data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      departmentCache.clear();
      semesterCache.clear();
      subjectCache.clear();
    }
  }
);

export default router;
