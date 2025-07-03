import multer from 'multer';
import ExcelJS from 'exceljs';
import { PrismaClient, SubjectType } from '@prisma/client';
import express, { Request, Response, Router } from 'express';

const COLLEGE_ID = 'LDRP-ITR';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const departmentCache = new Map();
const academicYearCache = new Map(); // Cache for AcademicYear
const semesterCache = new Map();
const collegeCache = new Map();

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

// Function to ensure AcademicYear exists and is cached
async function ensureAcademicYear(yearString: string) {
  let academicYear = academicYearCache.get(yearString);
  if (!academicYear) {
    academicYear = await prisma.academicYear.upsert({
      where: { yearString: yearString },
      create: { yearString: yearString },
      update: {},
    });
    academicYearCache.set(yearString, academicYear);
  }
  return academicYear;
}

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

      // --- FIX: Generate academic year in "YYYY-YYYY" format ---
      const currentYear = new Date().getFullYear();
      const currentYearString = `${currentYear - 1}-${currentYear}`;

      // Clear caches at the beginning of the request
      departmentCache.clear();
      academicYearCache.clear();
      semesterCache.clear();
      collegeCache.clear();

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Extract values from Excel columns based on your provided header:
        // Sr. No. | Subject Name | Abbreviation | Subject Code | Semester | Is Elective? | Department
        const subjectName = getCellValue(row.getCell(2))?.trim() || ''; // Column B
        const subjectAbbreviation = getCellValue(row.getCell(3))?.trim() || ''; // Column C
        const subjectCode = getCellValue(row.getCell(4))?.trim() || ''; // Column D
        const semesterNumberStr = getCellValue(row.getCell(5))?.trim() || ''; // Column E
        const isElectiveStr =
          getCellValue(row.getCell(6))?.toUpperCase()?.trim() || ''; // Column F
        const deptAbbreviation = getCellValue(row.getCell(7))?.trim() || ''; // Column G (Renamed for clarity)

        // Basic validation: Skip row if essential identifiers are missing
        if (
          !subjectName ||
          !subjectAbbreviation ||
          !subjectCode ||
          !semesterNumberStr ||
          !deptAbbreviation
        ) {
          console.warn(
            `Skipping row ${rowNumber}: Missing Subject Name (B), Abbreviation (C), Code (D), Semester (E), or Department (G).`
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

        // Ensure College exists (cached)
        const college = await ensureCollege();

        // Ensure Department exists (cached)
        let department = departmentCache.get(deptAbbreviation);
        if (!department) {
          let departmentName = deptAbbreviation;
          // Map common abbreviations to full names if necessary
          if (deptAbbreviation === 'CE') {
            departmentName = 'Computer Engineering';
          } else if (deptAbbreviation === 'IT') {
            departmentName = 'Information Technology';
          } else if (deptAbbreviation === 'EC') {
            departmentName = 'Electronics and Communication Engineering';
          }
          // ... add other mappings as needed

          department = await prisma.department.upsert({
            where: {
              name_collegeId: {
                // Unique constraint on name and collegeId
                name: departmentName,
                collegeId: college.id,
              },
            },
            create: {
              name: departmentName,
              abbreviation: deptAbbreviation,
              hodName: `HOD of ${departmentName}`,
              hodEmail: `hod.${deptAbbreviation.toLowerCase()}@ldrp.ac.in`,
              collegeId: college.id,
            },
            update: {},
          });
          departmentCache.set(deptAbbreviation, department);
        }

        // Ensure AcademicYear exists and get its ID (using current year string in YYYY-YY format)
        const academicYear = await ensureAcademicYear(currentYearString);

        // Ensure Semester exists (cached), now using academicYearId in its unique key
        const semesterKey = `${department.id}_${semesterNumber}_${academicYear.id}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              // Updated unique constraint to include academicYearId
              departmentId_semesterNumber_academicYearId: {
                // Ensure this matches your schema's unique constraint name
                departmentId: department.id,
                semesterNumber: semesterNumber,
                academicYearId: academicYear.id, // Use academicYear.id
              },
            },
            create: {
              departmentId: department.id,
              semesterNumber: semesterNumber,
              academicYearId: academicYear.id, // Use academicYear.id
            },
            update: {}, // No specific update needed if found by unique constraint
          });
          semesterCache.set(semesterKey, semester);
        }

        // --- Prepare New Subject Data from Excel ---
        const newSubjectData = {
          name: subjectName,
          abbreviation: subjectAbbreviation,
          subjectCode: subjectCode,
          type:
            isElectiveStr === 'TRUE'
              ? SubjectType.ELECTIVE
              : SubjectType.MANDATORY, // Column F
          departmentId: department.id,
          semesterId: semester.id, // Link to the year-specific semester instance
        };

        // --- Find Existing Subject and Compare ---
        // Subject is unique by departmentId and abbreviation
        const existingSubject = await prisma.subject.findUnique({
          where: {
            departmentId_abbreviation: {
              departmentId: newSubjectData.departmentId,
              abbreviation: newSubjectData.abbreviation,
            },
          },
          select: {
            // Select all fields that can be updated for comparison
            id: true, // Need ID for update
            name: true,
            abbreviation: true,
            subjectCode: true,
            type: true,
            departmentId: true,
            semesterId: true, // Select semesterId for comparison
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
            semesterId: existingSubject.semesterId, // Compare semesterId
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
                id: existingSubject.id, // Update by ID is generally safer after finding by unique combo
              },
              data: {
                name: newSubjectData.name,
                subjectCode: newSubjectData.subjectCode,
                type: newSubjectData.type,
                semesterId: newSubjectData.semesterId, // Update the semester association
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
        rowsAffected: addedCount + updatedCount,
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        message: 'Error processing subject data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      departmentCache.clear();
      academicYearCache.clear();
      semesterCache.clear();
      // subjectCache.clear(); // Subject cache is not actively used for pre-fetching, can remain or be removed
      collegeCache.clear();
    }
  }
);

export default router;
