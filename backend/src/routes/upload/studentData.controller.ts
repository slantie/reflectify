import { Request, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma'; // Import the singleton Prisma client
import { SemesterTypeEnum } from '@prisma/client'; // Import the new SemesterTypeEnum

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
const divisionCache = new Map();

// --- Canonical Department Mapping ---
// This map defines the canonical full name and abbreviation for each department.
// Keyed by a common identifier (e.g., the abbreviation) for easy lookup.
const DEPARTMENT_MAPPING: Record<
  string,
  { name: string; abbreviation: string }
> = {
  CE: { name: 'Computer Engineering', abbreviation: 'CE' },
  IT: { name: 'Information Technology', abbreviation: 'IT' },
  EC: { name: 'Electronics & Communication Engineering', abbreviation: 'EC' },
  MECH: { name: 'Mechanical Engineering', abbreviation: 'MECH' },
  CIVIL: { name: 'Civil Engineering', abbreviation: 'CIVIL' },
  AUTO: { name: 'Automobile Engineering', abbreviation: 'AUTO' },
  EE: { name: 'Electrical Engineering', abbreviation: 'EE' },
  // Add any other departments here
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
        images: {}, // Assuming images is a JSON field or similar
        isDeleted: false, // Ensure new college is not soft-deleted
      },
      update: {}, // No specific update data needed if it exists
    });
    collegeCache.set(COLLEGE_ID, college);
  }
  return college;
}

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
    return value.text?.toString() || ''; // For hyperlink cells, use the text
  }
  return value?.toString() || ''; // Convert other values to string
};

/**
 * @description Handles the upload and processing of student data from an Excel file.
 * It reads student details, ensures related academic entities exist, and
 * creates or updates student records in the database.
 * This function is designed to be used as an Express route handler AFTER Multer processes the file.
 * @param {Request} req - Express Request object (expects req.file to be populated by Multer)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const uploadStudentData = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Initialize skippedRowsDetails here to ensure it's always available for the final response
  let skippedRowsDetails: string[] = [];
  let updatedRows = 0;
  let addedRows = 0;
  let skippedCount = 0;

  try {
    // Multer middleware should have already processed the file and populated req.file
    if (!req.file) {
      res.status(400).json({
        message: 'No file uploaded or file processing failed by multer.',
        skippedRowsDetails: skippedRowsDetails, // Include empty array if no file
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer); // Load the Excel file from the buffer
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet

    if (!worksheet) {
      res.status(400).json({
        message: 'Invalid worksheet: Worksheet not found in the Excel file.',
        skippedRowsDetails: skippedRowsDetails, // Include empty array if no worksheet
      });
      return;
    }

    const startTime = Date.now();

    // Clear caches at the beginning of the request to ensure fresh data
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();

    // Iterate over rows, starting from the second row (assuming first is header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Extract data from specific columns (adjust column indices if your Excel template changes)
      const studentName = getCellValue(row.getCell(2))?.trim();
      const enrollmentNumber = getCellValue(row.getCell(3))?.trim();
      const deptAbbreviationInput = getCellValue(row.getCell(4))?.trim(); // Renamed for clarity
      const semesterNumberStr = getCellValue(row.getCell(5))?.trim();
      const divisionName = getCellValue(row.getCell(6))?.trim();
      const studentBatch = getCellValue(row.getCell(7))?.trim();
      const email = getCellValue(row.getCell(8))?.trim()?.toLowerCase(); // Normalize email to lowercase
      const academicYearString = getCellValue(row.getCell(9))?.trim(); // Renamed for clarity
      const intakeYear = getCellValue(row.getCell(10))?.trim();

      // Validate essential fields for a student record
      if (
        !studentName ||
        !enrollmentNumber ||
        !deptAbbreviationInput ||
        !semesterNumberStr ||
        !divisionName ||
        !email ||
        !academicYearString ||
        !intakeYear
      ) {
        const message = `Row ${rowNumber}: Skipping due to missing essential data. Enrollment: '${enrollmentNumber}', Email: '${email}'.`;
        console.warn(message);
        skippedRowsDetails.push(message); // Add to details for frontend
        skippedCount++;
        continue; // Skip to the next row if essential data is missing
      }

      const semesterNumber = parseInt(semesterNumberStr);
      if (isNaN(semesterNumber)) {
        const message = `Row ${rowNumber}: Skipping due to invalid Semester Number: '${semesterNumberStr}'.`;
        console.warn(message);
        skippedRowsDetails.push(message); // Add to details for frontend
        skippedCount++;
        continue; // Skip if semester number is not a valid integer
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
        // Ensure College exists
        const college = await ensureCollege();

        // --- Department Lookup/Upsert Logic (using canonical mapping) ---
        let department = departmentCache.get(deptAbbreviationInput);
        let canonicalDept: { name: string; abbreviation: string } | undefined;

        if (!department) {
          // Attempt to find canonical department details from our mapping
          canonicalDept =
            DEPARTMENT_MAPPING[deptAbbreviationInput.toUpperCase()];

          if (!canonicalDept) {
            for (const key in DEPARTMENT_MAPPING) {
              if (
                DEPARTMENT_MAPPING[key].name.toLowerCase() ===
                deptAbbreviationInput.toLowerCase()
              ) {
                canonicalDept = DEPARTMENT_MAPPING[key]; // Corrected typo here
                break;
              }
            }
          }

          if (!canonicalDept) {
            const message = `Row ${rowNumber}: Department '${deptAbbreviationInput}' not found in predefined mapping. Using input as canonical.`;
            console.warn(message);
            // This is a warning, but we still proceed to create/upsert the department, so not counted as skipped for now
            canonicalDept = {
              name: deptAbbreviationInput,
              abbreviation: deptAbbreviationInput,
            };
          }

          department = await prisma.department.upsert({
            where: {
              name_collegeId: {
                name: canonicalDept.name,
                collegeId: college.id,
              },
              isDeleted: false, // Only consider non-soft-deleted departments
            },
            create: {
              name: canonicalDept.name,
              abbreviation: canonicalDept.abbreviation,
              hodName: `HOD of ${canonicalDept.name}`,
              hodEmail: `hod.${canonicalDept.abbreviation.toLowerCase()}@ldrp.ac.in`,
              collegeId: college.id,
              isDeleted: false, // Ensure new department is not soft-deleted
            },
            update: {
              name: canonicalDept.name,
              abbreviation: canonicalDept.abbreviation,
              // Do not update hodName/hodEmail here as they are placeholder and might be set by faculty upload
            },
          });
          departmentCache.set(deptAbbreviationInput, department);
        }

        if (!department) {
          const message = `Row ${rowNumber}: Department '${deptAbbreviationInput}' could not be created or found.`;
          console.warn(message);
          skippedRowsDetails.push(message); // Add to details for frontend
          skippedCount++;
          continue;
        }

        // --- AcademicYear Lookup (Explicit Management) ---
        let academicYear = academicYearCache.get(academicYearString);
        if (!academicYear) {
          academicYear = await prisma.academicYear.findFirst({
            where: {
              yearString: academicYearString,
              isDeleted: false, // Only consider non-soft-deleted academic years
            },
          });
          if (!academicYear) {
            const message = `Row ${rowNumber}: Academic Year '${academicYearString}' not found. Please create it first via the Academic Year management API.`;
            console.warn(message);
            skippedRowsDetails.push(message); // Add to details for frontend
            skippedCount++;
            continue; // Skip if academic year is not found
          }
          academicYearCache.set(academicYearString, academicYear);
        }

        // --- Academic Year Activation Logic ---
        // If the academic year found/used for this student is not currently active, make it active.
        // And deactivate any other currently active academic year.
        if (!academicYear.isActive) {
          await prisma.$transaction(async (tx) => {
            // Find the currently active academic year (if any)
            const currentActiveYear = await tx.academicYear.findFirst({
              where: { isActive: true, isDeleted: false },
            });

            // If there's a different active year, deactivate it
            if (currentActiveYear && currentActiveYear.id !== academicYear.id) {
              await tx.academicYear.update({
                where: { id: currentActiveYear.id },
                data: { isActive: false },
              });
              console.log(
                `Deactivated previous active Academic Year: ${currentActiveYear.yearString}`
              );
            }

            // Activate the academic year associated with the current student data
            await tx.academicYear.update({
              where: { id: academicYear.id },
              data: { isActive: true },
            });
            console.log(`Activated Academic Year: ${academicYear.yearString}`);
            // Update the cached object to reflect its new active status
            academicYear.isActive = true;
          });
        }

        // --- Semester Lookup/Upsert Logic (with new fields) ---
        const semesterKey = `${department.id}_${semesterNumber}_${academicYear.id}_${semesterType}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              departmentId_semesterNumber_academicYearId_semesterType: {
                // Updated unique constraint
                departmentId: department.id,
                semesterNumber: semesterNumber,
                academicYearId: academicYear.id,
                semesterType: semesterType, // Include semesterType in where clause
              },
              isDeleted: false, // Only consider non-soft-deleted semesters
            },
            create: {
              departmentId: department.id,
              semesterNumber: semesterNumber,
              academicYearId: academicYear.id,
              semesterType: semesterType, // Include semesterType in create data
              // startDate and endDate are optional and not in Excel for now, will be managed by Semester controller
              isDeleted: false, // Ensure new semester is not soft-deleted
            },
            update: {
              // No specific update needed if found, but ensure semesterType is consistent
              semesterType: semesterType,
            },
          });
          semesterCache.set(semesterKey, semester);
        }

        // --- Division Lookup/Upsert Logic ---
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
              isDeleted: false, // Only consider non-soft-deleted divisions
            },
            create: {
              departmentId: department.id,
              semesterId: semester.id,
              divisionName: divisionName,
              studentCount: 0, // Initial count, can be updated later if needed
              isDeleted: false, // Ensure new division is not soft-deleted
            },
            update: {},
          });
          divisionCache.set(divisionKey, division);
        }

        // --- Student Processing Logic: Prioritize email for updates, handle enrollment conflicts ---
        let studentRecord = await prisma.student.findUnique({
          where: { email: email, isDeleted: false }, // Filter out soft-deleted students
        });

        if (studentRecord) {
          // Student record found by email, attempt to update it.
          const dataToUpdate: any = {};
          let hasChanges = false;

          // Compare and prepare updates
          if (studentRecord.name !== studentName) {
            dataToUpdate.name = studentName;
            hasChanges = true;
          }
          if (studentRecord.phoneNumber !== email) {
            // Assuming phoneNumber can be updated to email
            dataToUpdate.phoneNumber = email;
            hasChanges = true;
          }
          if (studentRecord.academicYearId !== academicYear.id) {
            dataToUpdate.academicYearId = academicYear.id;
            hasChanges = true;
          }
          if (studentRecord.batch !== studentBatch) {
            dataToUpdate.batch = studentBatch;
            hasChanges = true;
          }
          if (studentRecord.intakeYear !== intakeYear) {
            dataToUpdate.intakeYear = intakeYear;
            hasChanges = true;
          }
          if (studentRecord.departmentId !== department.id) {
            dataToUpdate.departmentId = department.id;
            hasChanges = true;
          }
          if (studentRecord.semesterId !== semester.id) {
            dataToUpdate.semesterId = semester.id;
            hasChanges = true;
          }
          if (studentRecord.divisionId !== division.id) {
            dataToUpdate.divisionId = division.id;
            hasChanges = true;
          }

          // Handle enrollment number changes and conflicts carefully
          if (studentRecord.enrollmentNumber !== enrollmentNumber) {
            const existingStudentWithNewEnrollmentNumber =
              await prisma.student.findUnique({
                where: { enrollmentNumber: enrollmentNumber, isDeleted: false }, // Check only non-soft-deleted
              });

            if (
              existingStudentWithNewEnrollmentNumber &&
              existingStudentWithNewEnrollmentNumber.id !== studentRecord.id // Ensure it's not the same student
            ) {
              // Conflict: The new enrollment number from Excel is already associated with another *active* student
              const message = `Row ${rowNumber}: Skipping update for student with email '${email}': New enrollment number '${enrollmentNumber}' is already taken by another active student (ID: ${existingStudentWithNewEnrollmentNumber.id}).`;
              console.warn(message);
              skippedRowsDetails.push(message); // Add to details for frontend
              skippedCount++;
              continue; // Skip this row to prevent unique constraint violation
            }
            dataToUpdate.enrollmentNumber = enrollmentNumber;
            hasChanges = true;
          }

          if (hasChanges) {
            // Only perform update if actual changes are detected
            await prisma.student.update({
              where: { id: studentRecord.id }, // Update based on the found student's ID for robustness
              data: dataToUpdate, // Only send changed fields
            });
            updatedRows++; // Increment only if actual changes were made
          }
          // If no changes, the row is effectively "processed" but not "updated" or "added"
        } else {
          // Student record not found by email. Now, check if the enrollment number is already taken by an active student.
          const existingStudentByEnrollmentNumber =
            await prisma.student.findUnique({
              where: { enrollmentNumber: enrollmentNumber, isDeleted: false },
            });

          if (existingStudentByEnrollmentNumber) {
            // Conflict: The enrollment number from Excel is already taken by an existing *active* student,
            // but the email is new. This indicates a data inconsistency.
            const message = `Row ${rowNumber}: Skipping creation for student with enrollment number '${enrollmentNumber}': This enrollment number is already taken by an active student (ID: ${existingStudentByEnrollmentNumber.id}, Email: ${existingStudentByEnrollmentNumber.email}), but the email '${email}' is new. Manual review needed.`;
            console.warn(message);
            skippedRowsDetails.push(message); // Add to details for frontend
            skippedCount++;
            continue; // Skip this row
          }

          // If neither email nor enrollment number exists (or if they exist but are soft-deleted), create a new student.
          // Note: If you want to "reactivate" a soft-deleted student if their email/enrollment matches,
          // you'd need additional logic here to find soft-deleted records and update `isDeleted: false`.
          // For now, this creates a new record if no *active* match is found.
          await prisma.student.create({
            data: {
              name: studentName,
              enrollmentNumber: enrollmentNumber,
              email: email,
              phoneNumber: email, // Assuming phoneNumber can be set to email if not provided
              academicYear: { connect: { id: academicYear.id } },
              batch: studentBatch,
              intakeYear: intakeYear,
              department: { connect: { id: department.id } },
              semester: { connect: { id: semester.id } },
              division: { connect: { id: division.id } },
              isDeleted: false, // Ensure new student is not soft-deleted
            },
          });
          addedRows++; // Increment for newly added rows
        }
      } catch (innerError: any) {
        // Catch any errors that occur during the processing of a single row.
        const message = `Row ${rowNumber}: Error processing data for Enrollment '${enrollmentNumber}', Email '${email}': ${innerError.message || 'Unknown error'}.`;
        console.error(message, innerError); // Log full error for backend debugging
        skippedRowsDetails.push(message); // Add to details for frontend
        skippedCount++;
      }
    }

    const endTime = Date.now();
    console.log(
      '🕒 Student data processing completed in',
      ((endTime - startTime) / 1000).toFixed(2),
      'seconds'
    );

    // Send a simplified summary response back to the client.
    // This is the ONLY place a success response is sent.
    res.status(200).json({
      message: 'Student data processing complete.',
      rowsAffected: addedRows + updatedRows,
    });
  } catch (error: any) {
    // Catch any top-level errors (e.g., file upload issues, workbook loading).
    // This is the ONLY place an error response is sent.
    console.error('Error processing student data:', error);
    // Ensure response is only sent if headers haven't been sent already
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error processing student data',
        error: error.message || 'Unknown error',
        skippedRowsDetails: skippedRowsDetails, // Include details even on top-level error if any were collected
      });
    }
  } finally {
    // Clear all caches after processing to free up memory.
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();
  }
};
