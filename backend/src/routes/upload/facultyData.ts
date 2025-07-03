import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import express, { Request, Response, Router } from 'express';
import multer from 'multer';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const COLLEGE_ID = 'LDRP-ITR';
const departmentCache = new Map();
const facultyCache = new Map();
const collegeCache = new Map();

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
  upload.single('facultyData'),
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

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const deptName = row.getCell(5).value?.toString() || '';

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

          if (department) {
            departmentCache.set(deptName, department);
          }
        }

        const facultyKey = row.getCell(4).value?.toString() || '';
        let faculty = facultyCache.get(facultyKey);

        if (!faculty && department) {
          faculty = await prisma.faculty.upsert({
            where: { abbreviation: facultyKey },
            create: {
              name: row.getCell(2).value?.toString() || '',
              email: getCellValue(row.getCell(3)),
              abbreviation: facultyKey,
              designation: 'Assistant Professor',
              seatingLocation: `${department.name} Department`,
              joiningDate: new Date(),
              departmentId: department.id,
            },
            update: {},
          });

          facultyCache.set(facultyKey, faculty);
          processedRows.push(faculty);
        }
      }

      const end_time = Date.now();
      console.log(
        '🕒 Faculty data processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );

      res.status(200).json({
        message: 'Faculty data updated successfully',
        count: processedRows.length,
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        message: 'Error processing faculty data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      departmentCache.clear();
      facultyCache.clear();
      collegeCache.clear();
    }
  }
);
export default router;
