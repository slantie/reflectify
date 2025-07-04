import { Request, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma'; // Import the singleton Prisma client
import { SubjectType, SemesterTypeEnum } from '@prisma/client'; // Import SubjectType and SemesterTypeEnum

// Multer configuration for file uploads
export const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Caches to reduce database lookups for frequently accessed entities
const COLLEGE_ID = 'LDRP-ITR'; // Assuming this is a constant for your college
const collegeCache = new Map();
const departmentCache = new Map();
const academicYearCache = new Map();
const semesterCache = new Map();

// --- Canonical Department Mapping ---
// This map defines the canonical full name and abbreviation for each department.
// Keyed by a common identifier (e.g., the abbreviation) for easy lookup.
const DEPARTMENT_MAPPING: Record<
  string,
  { name: string; abbreviation: string }
> = {
  CE: { name: 'Computer Engineering', abbreviation: 'CE' },
  IT: { name: 'Information Technology', abbreviation: 'IT' },
  EC: { name: 'Electronics and Communication Engineering', abbreviation: 'EC' },
  MECH: { name: 'Mechanical Engineering', abbreviation: 'MECH' },
  CIVIL: { name: 'Civil Engineering', abbreviation: 'CIVIL' },
  AUTO: { name: 'Automobile Engineering', abbreviation: 'AUTO' },
  EE: { name: 'Electrical Engineering', abbreviation: 'EE' },
  // Add any other departments here
};

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
    return value.text?.toString() || '';
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
      where: { id: COLLEGE_ID, isDeleted: false }, // Filter out soft-deleted colleges
      create: {
        id: COLLEGE_ID,
        name: 'LDRP Institute of Technology and Research',
        websiteUrl: 'https://ldrp.ac.in',
        address: 'Sector 15, Gandhinagar, Gujarat',
        contactNumber: '+91-79-23241492',
        logo: 'ldrp-logo.png',
        images: {},
        isDeleted: false, // Ensure new college is not soft-deleted
      },
      update: {}, // No specific update needed if it exists
    });
    collegeCache.set(COLLEGE_ID, college);
  }
  return college;
}

/**
 * Finds the AcademicYear record in the database and caches it.
 * It does NOT create the academic year if it doesn't exist.
 * @param {string} yearString - The academic year string (e.g., "2024-2025").
 * @returns {Promise<any | null>} The AcademicYear record, or null if not found.
 */
async function findAcademicYear(yearString: string) {
  let academicYear = academicYearCache.get(yearString);
  if (!academicYear) {
    academicYear = await prisma.academicYear.findFirst({
      where: { yearString: yearString, isDeleted: false }, // Only consider non-soft-deleted academic years
    });
    if (academicYear) {
      academicYearCache.set(yearString, academicYear);
    }
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
  // Initialize these variables at the top to ensure they are always available for the final response
  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let skippedCount = 0;
  const skippedRowsDetails: string[] = []; // Array to store details of skipped rows for frontend

  try {
    // Multer middleware should have already processed the file and populated req.file
    if (!req.file) {
      res.status(400).json({
        message: 'No file uploaded or file processing failed by multer.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      res.status(400).json({
        message: 'Invalid worksheet: Worksheet not found in the Excel file.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }

    const startTime = Date.now();

    // Determine the current academic year string (e.g., "2024-2025")
    // This logic assumes subjects are being added for the 'current' academic year based on the server's date.
    // If subjects can be added for arbitrary academic years, this should come from the Excel file or request body.
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
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();

    // Ensure College exists (cached)
    const college = await ensureCollege();

    // Find the AcademicYear for the current year string
    const academicYear = await findAcademicYear(currentYearString);
    if (!academicYear) {
      const message = `Academic Year '${currentYearString}' not found. Please create it first via the Academic Year management API before uploading subjects.`;
      console.error(message);
      // Since all subjects depend on this, we'll return an error immediately
      if (!res.headersSent) {
        res.status(400).json({
          message: message,
          skippedRowsDetails: skippedRowsDetails, // Include any previously collected details
        });
      }
      return;
    }

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
      const deptAbbreviationInput = getCellValue(row.getCell(7))?.trim() || ''; // Column G - Renamed for clarity

      // Basic validation: Skip row if essential identifiers are missing
      if (
        !subjectName ||
        !subjectAbbreviation ||
        !subjectCode ||
        !semesterNumberStr ||
        !deptAbbreviationInput
      ) {
        const message = `Row ${rowNumber}: Skipping due to missing essential data (Subject Name, Abbreviation, Code, Semester, or Department).`;
        console.warn(message);
        skippedRowsDetails.push(message);
        skippedCount++;
        continue;
      }

      const semesterNumber = parseInt(semesterNumberStr, 10);
      if (isNaN(semesterNumber)) {
        const message = `Row ${rowNumber}: Invalid Semester Number (Col E): '${semesterNumberStr}'. Must be a number.`;
        console.warn(message);
        skippedRowsDetails.push(message);
        skippedCount++;
        continue;
      }

      // Determine SemesterTypeEnum (ODD/EVEN) based on semester number
      let semesterType: SemesterTypeEnum;
      if (semesterNumber % 2 !== 0) {
        // Odd semesters: 1, 3, 5, 7
        semesterType = SemesterTypeEnum.ODD;
      } else {
        // Even semesters: 2, 4, 6, 8
        semesterType = SemesterTypeEnum.EVEN;
      }

      try {
        // --- Department Lookup/Upsert Logic (Revised for Consistency and soft-delete) ---
        let department = departmentCache.get(deptAbbreviationInput); // Try to get from cache using original input string
        let canonicalDept: { name: string; abbreviation: string } | undefined;

        if (!department) {
          // Attempt to find canonical department details from our mapping
          canonicalDept =
            DEPARTMENT_MAPPING[deptAbbreviationInput.toUpperCase()]; // Use uppercase for map key lookup

          if (!canonicalDept) {
            // If not found as an abbreviation, check if it's a full name
            for (const key in DEPARTMENT_MAPPING) {
              if (
                DEPARTMENT_MAPPING[key].name.toLowerCase() ===
                deptAbbreviationInput.toLowerCase()
              ) {
                canonicalDept = DEPARTMENT_MAPPING[key];
                break;
              }
            }
          }

          if (!canonicalDept) {
            // If still not found in our predefined map, use the input as is, but warn
            const message = `Row ${rowNumber}: Department '${deptAbbreviationInput}' not found in predefined mapping. Using input as canonical.`;
            console.warn(message);
            skippedRowsDetails.push(message); // Add warning to details
            canonicalDept = {
              name: deptAbbreviationInput,
              abbreviation: deptAbbreviationInput,
            }; // Fallback to using input as both
          }

          // Now, use the canonical name and abbreviation for database operations
          department = await prisma.department.upsert({
            where: {
              name_collegeId: {
                // Use the canonical name for the unique constraint
                name: canonicalDept.name,
                collegeId: college.id,
              },
              isDeleted: false, // Only consider non-soft-deleted departments
            },
            create: {
              name: canonicalDept.name,
              abbreviation: canonicalDept.abbreviation,
              hodName: `HOD of ${canonicalDept.name}`, // Placeholder HOD name
              hodEmail: `hod.${canonicalDept.abbreviation.toLowerCase()}@ldrp.ac.in`, // Placeholder HOD email
              collegeId: college.id,
              isDeleted: false, // Ensure new department is not soft-deleted
            },
            update: {
              // Ensure existing department's name and abbreviation are updated to canonical form
              name: canonicalDept.name,
              abbreviation: canonicalDept.abbreviation,
            },
          });
          departmentCache.set(deptAbbreviationInput, department); // Cache using the original input string for future lookups in this request
        }

        if (!department) {
          const message = `Row ${rowNumber}: Department '${deptAbbreviationInput}' (Col G) could not be created or found after all attempts.`;
          console.warn(message);
          skippedRowsDetails.push(message);
          skippedCount++;
          continue;
        }

        // Ensure Semester exists (cached), now using academicYearId and semesterType in its unique key
        const semesterKey = `${department.id}_${semesterNumber}_${academicYear.id}_${semesterType}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              // Updated unique constraint to include academicYearId and semesterType
              departmentId_semesterNumber_academicYearId_semesterType: {
                departmentId: department.id,
                semesterNumber: semesterNumber,
                academicYearId: academicYear.id, // Use academicYear.id
                semesterType: semesterType, // Include semesterType
              },
              isDeleted: false, // Only consider non-soft-deleted semesters
            },
            create: {
              departmentId: department.id,
              semesterNumber: semesterNumber,
              academicYearId: academicYear.id, // Use academicYear.id
              semesterType: semesterType, // Include semesterType
              isDeleted: false, // Ensure new semester is not soft-deleted
            },
            update: {
              // No specific update needed if found by unique constraint, but ensure semesterType is consistent
              semesterType: semesterType,
            },
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

        // --- Find Existing Subject and Compare (with soft-delete filter) ---
        // Subject is unique by departmentId and abbreviation
        const existingSubject = await prisma.subject.findUnique({
          where: {
            departmentId_abbreviation: {
              departmentId: newSubjectData.departmentId,
              abbreviation: newSubjectData.abbreviation,
            },
            isDeleted: false, // Only consider non-soft-deleted subjects
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
                isDeleted: false, // Ensure it's not soft-deleted if it was for some reason
              },
            });
            updatedCount++;
          } else {
            unchangedCount++; // Subject found, but no data changes
          }
        } else {
          // Create new subject
          await prisma.subject.create({
            data: {
              ...newSubjectData,
              isDeleted: false, // Ensure new subject is not soft-deleted
            },
          });
          addedCount++;
        }
      } catch (innerError: any) {
        const message = `Row ${rowNumber}: Error processing data for Subject '${subjectName}', Dept: '${deptAbbreviationInput}': ${innerError.message || 'Unknown error'}.`;
        console.error(message, innerError);
        skippedRowsDetails.push(message);
        skippedCount++;
      }
    }

    const endTime = Date.now();
    console.log(
      '🕒 Subject data processing completed in',
      ((endTime - startTime) / 1000).toFixed(2),
      'seconds'
    );

    // Send a summary response back to the client.
    // This is the ONLY place a success response is sent.
    res.status(200).json({
      message: 'Subject data import complete.',
      rowsAffected: addedCount + updatedCount,
    });
  } catch (error: any) {
    // Catch any top-level errors (e.g., file upload issues, workbook loading).
    console.error('Error processing subject data:', error);
    // Ensure response is only sent if headers haven't been sent already
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error processing subject data',
        error: error.message || 'Unknown error',
        skippedRowsDetails: skippedRowsDetails, // Include details even on top-level error if any were collected
      });
    }
  } finally {
    // Clear caches after request completion
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
  }
};
