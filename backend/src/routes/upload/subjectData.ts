import multer from 'multer';
import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';
import express, { Request, Response, Router } from 'express';

const COLLEGE_ID = 'LDRP-ITR';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const departmentCache = new Map();
const subjectCache = new Map(); // This cache won't be as useful with individual findUnique, but can remain
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

// getCellValue is fine as is, as it returns string for non-date/hyperlink cells
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

      let addedCount = 0;
      let updatedCount = 0;
      let unchangedCount = 0;
      let skippedCount = 0; // For rows that cannot be processed due to missing data

      const currentYear = new Date().getFullYear().toString();

      // Clear caches at the beginning of the request
      departmentCache.clear();
      semesterCache.clear();
      collegeCache.clear(); // Ensure college is fresh or ensureCollege handles it

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const deptName = getCellValue(row.getCell(7))?.trim() || ''; // Column G
        const semesterNumberStr = getCellValue(row.getCell(5))?.trim() || ''; // Column E
        const subjectAbbreviation = getCellValue(row.getCell(3))?.trim() || ''; // Column C

        // Basic validation: Skip row if essential identifiers are missing
        if (!deptName || !semesterNumberStr || !subjectAbbreviation) {
          console.warn(
            `Skipping row ${rowNumber}: Missing Department Name (Col G), Semester Number (Col E), or Subject Abbreviation (Col C).`
          );
          skippedCount++;
          continue;
        }

        const semesterNumber = parseInt(semesterNumberStr, 10);
        if (isNaN(semesterNumber)) {
          console.warn(
            `Skipping row ${rowNumber}: Invalid Semester Number (Col E): '${semesterNumberStr}'. Must be a number.`
          );
          skippedCount++;
          continue;
        }

        // --- Department Lookup/Creation ---
        let department = departmentCache.get(deptName);
        if (!department) {
          // Assuming department abbreviation is unique or you have a specific way to find it
          department = await prisma.department.findFirst({
            where: { abbreviation: deptName },
          });
          if (!department) {
            console.warn(
              `Skipping row ${rowNumber}: Department with abbreviation '${deptName}' not found.`
            );
            skippedCount++;
            continue;
          }
          departmentCache.set(deptName, department);
        }

        // --- Semester Lookup/Upsert ---
        const semesterKey = `${department.id}_${semesterNumber}_${currentYear}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              departmentId_semesterNumber: {
                departmentId: department.id,
                semesterNumber: semesterNumber,
              },
            },
            create: {
              departmentId: department.id,
              semesterNumber: semesterNumber,
              academicYear: currentYear,
            },
            update: {}, // No specific update needed if found by unique constraint
          });
          semesterCache.set(semesterKey, semester);
        }

        // --- Prepare New Subject Data from Excel ---
        const newSubjectData = {
          name: getCellValue(row.getCell(2))?.trim() || '', // Column B
          abbreviation: subjectAbbreviation, // Column C
          subjectCode: getCellValue(row.getCell(4))?.trim() || '', // Column D
          type:
            getCellValue(row.getCell(6))?.toUpperCase()?.trim() === 'TRUE'
              ? SubjectType.ELECTIVE
              : SubjectType.MANDATORY, // Column F (assuming TRUE/FALSE for elective)
          departmentId: department.id,
          semesterId: semester.id,
        };

        // --- Find Existing Subject and Compare ---
        const existingSubject = await prisma.subject.findUnique({
          where: {
            departmentId_abbreviation: {
              departmentId: newSubjectData.departmentId,
              abbreviation: newSubjectData.abbreviation,
            },
          },
          select: {
            // Select all fields that can be updated for comparison
            name: true,
            abbreviation: true,
            subjectCode: true,
            type: true,
            departmentId: true,
            semesterId: true,
          },
        });

        if (existingSubject) {
          // Normalize existing data for comparison (trim strings)
          const existingNormalizedData = {
            name: existingSubject.name?.trim() || '',
            abbreviation: existingSubject.abbreviation?.trim() || '',
            subjectCode: existingSubject.subjectCode?.trim() || '',
            type: existingSubject.type, // Enum values don't need trimming
            departmentId: existingSubject.departmentId,
            semesterId: existingSubject.semesterId,
          };

          // Compare fields to determine if a change occurred
          const isChanged =
            existingNormalizedData.name !== newSubjectData.name ||
            existingNormalizedData.subjectCode !== newSubjectData.subjectCode ||
            existingNormalizedData.type !== newSubjectData.type ||
            existingNormalizedData.semesterId !== newSubjectData.semesterId; // Subject's semester can change
          // Abbreviation and departmentId are part of the unique key, so they won't change for an existing record

          if (isChanged) {
            await prisma.subject.update({
              where: {
                departmentId_abbreviation: {
                  departmentId: newSubjectData.departmentId,
                  abbreviation: newSubjectData.abbreviation,
                },
              },
              data: {
                name: newSubjectData.name,
                subjectCode: newSubjectData.subjectCode,
                type: newSubjectData.type,
                semesterId: newSubjectData.semesterId,
                // Do not update abbreviation or departmentId here, as they are part of the unique key
              },
            });
            updatedCount++;
          } else {
            unchangedCount++; // Subject found, but no data changes
          }
        } else {
          // Create new subject
          await prisma.subject.create({
            data: newSubjectData,
          });
          addedCount++;
        }
      }

      const end_time = Date.now();
      console.log(
        '🕒 Subject data processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );

      res.status(200).json({
        message: 'Subject data import summary',
        addedCount: addedCount,
        updatedCount: updatedCount,
        unchangedCount: unchangedCount,
        skippedCount: skippedCount,
        totalRowsProcessed:
          addedCount + updatedCount + unchangedCount + skippedCount,
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
      subjectCache.clear(); // Clear subject cache as well
    }
  }
);

export default router;
