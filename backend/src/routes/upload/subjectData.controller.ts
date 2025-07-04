import { Request, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma'; // Import the singleton Prisma client
import { SubjectType } from '@prisma/client'; // Import SubjectType enum

// Multer configuration for file uploads
export const upload = multer({
  // EXPORT THE MULTER INSTANCE
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Caches to reduce database lookups for frequently accessed entities
const COLLEGE_ID = 'LDRP-ITR'; // Assuming this is a constant for your college
const collegeCache = new Map();
const departmentCache = new Map();
const academicYearCache = new Map();
const semesterCache = new Map();

/**
 * Extracts the string value from an ExcelJS cell, handling rich text and hyperlinks.
 * @param {ExcelJS.Cell} cell - The ExcelJS cell object.
 * @returns {string} The string representation of the cell's value.
 */
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

/**
 * Ensures the College record exists in the database and caches it.
 * This prevents repeated database queries for the same college.
 * @returns {Promise<any>} The College record.
 */
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

/**
 * Ensures the AcademicYear record exists in the database and caches it.
 * @param {string} yearString - The academic year string (e.g., "2024-2025").
 * @returns {Promise<any>} The AcademicYear record.
 */
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

/**
 * @description Handles the upload and processing of subject data from an Excel file.
 * It reads subject details, ensures related department, academic year, and semester
 * entities exist, and creates or updates subject records in the database.
 * This function is designed to be used as an Express route handler AFTER Multer processes the file.
 * @param {Request} req - Express Request object (expects req.file to be populated by Multer)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const uploadSubjectData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Multer middleware should have already processed the file and populated req.file
    if (!req.file) {
      res
        .status(400)
        .json({
          message: 'No file uploaded or file processing failed by multer.',
        });
      return;
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      res.status(400).json({ message: 'Invalid worksheet' });
      return;
    }

    const startTime = Date.now();

    let addedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    let skippedCount = 0; // For rows that cannot be processed due to missing data

    // Determine the current academic year string (e.g., "2024-2025")
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed (Jan=0, Dec=11)
    let currentYear = now.getFullYear();
    // If current month is before August (0-6), assume previous academic year started in previous calendar year
    if (currentMonth < 7) {
      // Assuming academic year starts in August (month 7)
      currentYear = currentYear - 1;
    }
    const currentYearString = `${currentYear}-${currentYear + 1}`;

    // Clear caches at the beginning of the request to ensure fresh data
    collegeCache.clear(); // Clear college cache, it will be re-populated by ensureCollege
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();

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
      const deptAbbreviation = getCellValue(row.getCell(7))?.trim() || ''; // Column G

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

      try {
        // Ensure College exists (cached)
        const college = await ensureCollege();

        // Ensure Department exists (cached)
        let department = departmentCache.get(deptAbbreviation);
        if (!department) {
          let departmentFullName = deptAbbreviation;
          // Map common abbreviations to full names if necessary
          const departmentAbbreviationMap: Record<string, string> = {
            CE: 'Computer Engineering',
            IT: 'Information Technology',
            EC: 'Electronics and Communication Engineering',
            MECH: 'Mechanical Engineering',
            CIVIL: 'Civil Engineering',
            AUTO: 'Automobile Engineering',
            EE: 'Electrical Engineering',
          };

          // Try to find by abbreviation first, then by name if abbreviation is full name
          department = await prisma.department.findFirst({
            where: {
              OR: [
                { abbreviation: deptAbbreviation },
                { name: deptAbbreviation },
              ],
              collegeId: college.id,
            },
          });

          if (!department) {
            // If not found, create it
            department = await prisma.department.create({
              data: {
                name:
                  departmentAbbreviationMap[deptAbbreviation] ||
                  deptAbbreviation, // Use mapped name or abbreviation itself
                abbreviation: deptAbbreviation,
                hodName: `HOD of ${departmentAbbreviationMap[deptAbbreviation] || deptAbbreviation}`, // Placeholder HOD name
                hodEmail: `hod.${deptAbbreviation.toLowerCase()}@ldrp.ac.in`, // Placeholder HOD email
                collegeId: college.id,
              },
            });
          }
          departmentCache.set(deptAbbreviation, department);
        }

        if (!department) {
          console.warn(
            `Skipping row ${rowNumber}: Department '${deptAbbreviation}' (Column G) could not be created or found.`
          );
          skippedCount++;
          continue;
        }

        // Ensure AcademicYear exists and get its ID (using current year string in YYYY-YYYY format)
        const academicYear = await ensureAcademicYear(currentYearString);

        // Ensure Semester exists (cached), now using academicYearId in its unique key
        const semesterKey = `${department.id}_${semesterNumber}_${academicYear.id}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              // Updated unique constraint to include academicYearId
              departmentId_semesterNumber_academicYearId: {
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
      } catch (innerError: any) {
        console.error(
          `Error processing row ${rowNumber} (Subject: ${subjectName}, Dept: ${deptAbbreviation}):`,
          innerError
        );
        skippedCount++;
      }
    }

    const endTime = Date.now();
    console.log(
      '🕒 Subject data processing completed in',
      ((endTime - startTime) / 1000).toFixed(2),
      'seconds'
    );
    console.log(
      `Summary: Added ${addedCount}, Updated ${updatedCount}, Unchanged ${unchangedCount}, Skipped ${skippedCount} rows.`
    );

    res.status(200).json({
      message: 'Subject data import summary',
      rowsAffected: addedCount + updatedCount,
    });
  } catch (error: any) {
    console.error('Error processing subject data:', error);
    res.status(500).json({
      message: 'Error processing subject data',
      error: error.message || 'Unknown error',
    });
  } finally {
    // Clear caches after request completion
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    // subjectCache is not actively used for pre-fetching, can remain or be removed
  }
};
