import { Request, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma'; // Import the singleton Prisma client

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
const divisionCache = new Map();

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
        images: {}, // Assuming images is a JSON field or similar
      },
      update: {}, // No specific update data needed if it already exists
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
    return value.text || ''; // For hyperlink cells, use the text
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
  try {
    // Multer middleware should have already processed the file and populated req.file
    if (!req.file) {
      res.status(400).json({
        message: 'No file uploaded or file processing failed by multer.',
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer); // Load the Excel file from the buffer
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet

    if (!worksheet) {
      res.status(400).json({ message: 'Invalid worksheet' });
      return;
    }

    const startTime = Date.now();

    // Clear caches at the beginning of the request to ensure fresh data
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();

    let updatedRows = 0; // For actual changes made to existing rows
    let addedRows = 0; // For new rows added
    let skippedCount = 0; // For rows that could not be processed (internal logging)

    // Iterate over rows, starting from the second row (assuming first is header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Extract data from specific columns (adjust column indices if your Excel template changes)
      const studentName = getCellValue(row.getCell(2));
      const enrollmentNumber = getCellValue(row.getCell(3));
      const deptAbbreviation = getCellValue(row.getCell(4));
      const semesterNumberStr = getCellValue(row.getCell(5));
      const divisionName = getCellValue(row.getCell(6));
      const studentBatch = getCellValue(row.getCell(7));
      const email = getCellValue(row.getCell(8));
      const academicYearFromExcel = getCellValue(row.getCell(9));
      const intakeYear = getCellValue(row.getCell(10));

      // Validate essential fields for a student record
      if (
        !enrollmentNumber ||
        !deptAbbreviation ||
        !semesterNumberStr ||
        !divisionName ||
        !email ||
        !academicYearFromExcel ||
        !intakeYear
      ) {
        console.warn(
          `Skipping row ${rowNumber} due to missing essential data: Enrollment: ${enrollmentNumber}, Dept: ${deptAbbreviation}, Semester: ${semesterNumberStr}, Division: ${divisionName}, Email: ${email}, Academic Year: ${academicYearFromExcel}, Intake Year: ${intakeYear}`
        );
        skippedCount++;
        continue; // Skip to the next row if essential data is missing
      }

      const semesterNumber = parseInt(semesterNumberStr);
      if (isNaN(semesterNumber)) {
        console.warn(
          `Skipping row ${rowNumber} due to invalid Semester Number: ${semesterNumberStr}`
        );
        skippedCount++;
        continue; // Skip if semester number is not a valid integer
      }

      try {
        // Ensure College, Department, AcademicYear, Semester, and Division records exist
        const college = await ensureCollege();

        let department = departmentCache.get(deptAbbreviation);
        if (!department) {
          let departmentName = deptAbbreviation;
          // Map abbreviations to full department names (customize as needed)
          if (deptAbbreviation === 'CE') {
            departmentName = 'Computer Engineering';
          } else if (deptAbbreviation === 'IT') {
            departmentName = 'Information Technology';
          } else if (deptAbbreviation === 'EC') {
            departmentName = 'Electronics & Communication Engineering';
          } else if (deptAbbreviation === 'MECH') {
            departmentName = 'Mechanical Engineering';
          } else if (deptAbbreviation === 'CIVIL') {
            departmentName = 'Civil Engineering';
          } else if (deptAbbreviation === 'AUTO') {
            departmentName = 'Automobile Engineering';
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
              abbreviation: deptAbbreviation,
              hodName: `HOD of ${departmentName}`,
              hodEmail: `hod.${deptAbbreviation.toLowerCase()}@ldrp.ac.in`,
              collegeId: college.id,
            },
            update: {},
          });
          departmentCache.set(deptAbbreviation, department);
        }

        const academicYear = await ensureAcademicYear(academicYearFromExcel);

        const semesterKey = `${department.id}_${semesterNumber}_${academicYear.id}`;
        let semester = semesterCache.get(semesterKey);
        if (!semester) {
          semester = await prisma.semester.upsert({
            where: {
              departmentId_semesterNumber_academicYearId: {
                departmentId: department.id,
                semesterNumber: semesterNumber,
                academicYearId: academicYear.id,
              },
            },
            create: {
              departmentId: department.id,
              semesterNumber: semesterNumber,
              academicYearId: academicYear.id,
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
              studentCount: 0, // Initial count, can be updated later if needed
            },
            update: {},
          });
          divisionCache.set(divisionKey, division);
        }

        // --- Student Processing Logic: Prioritize email for updates, handle enrollment conflicts ---
        let studentRecord = await prisma.student.findUnique({
          where: { email: email }, // Try to find student by email first
        });

        if (studentRecord) {
          // Student record found by email, attempt to update it.
          const dataToUpdate: any = {};
          let hasChanges = false;

          if (studentRecord.name !== studentName) {
            dataToUpdate.name = studentName;
            hasChanges = true;
          }

          // Check for enrollment number changes and conflicts
          if (studentRecord.enrollmentNumber !== enrollmentNumber) {
            const existingStudentWithNewEnrollmentNumber =
              await prisma.student.findUnique({
                where: { enrollmentNumber: enrollmentNumber },
              });

            if (
              existingStudentWithNewEnrollmentNumber &&
              existingStudentWithNewEnrollmentNumber.email !== email
            ) {
              // Conflict: The new enrollment number from Excel is already associated with another student
              console.warn(
                `Skipping update for student with email ${email}: New enrollment number '${enrollmentNumber}' is already taken by another student (${existingStudentWithNewEnrollmentNumber.enrollmentNumber}).`
              );
              skippedCount++;
              continue; // Skip this row to prevent unique constraint violation
            }
            dataToUpdate.enrollmentNumber = enrollmentNumber;
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

          if (hasChanges) {
            // Only perform update if actual changes are detected
            await prisma.student.update({
              where: { email: email }, // Update based on the found email
              data: dataToUpdate, // Only send changed fields
            });
            updatedRows++; // Increment only if actual changes were made
          }
          // If no changes, the row is effectively "processed" but not "updated" or "added"
        } else {
          // Student record not found by email. Now, check if the enrollment number is already taken.
          const existingStudentByEnrollmentNumber =
            await prisma.student.findUnique({
              where: { enrollmentNumber: enrollmentNumber },
            });

          if (existingStudentByEnrollmentNumber) {
            // Conflict: The enrollment number from Excel is already taken by an existing student,
            // but the email is new. This indicates a data inconsistency.
            console.warn(
              `Skipping creation for student ${enrollmentNumber}: Enrollment number '${enrollmentNumber}' is already taken by an existing student (${existingStudentByEnrollmentNumber.email}), but the email '${email}' is new.`
            );
            skippedCount++;
            continue; // Skip this row
          }

          // If neither email nor enrollment number exists, create a new student.
          await prisma.student.create({
            data: {
              name: studentName,
              enrollmentNumber: enrollmentNumber,
              email: email,
              phoneNumber: email, // Assuming phoneNumber can be set to email
              academicYearId: academicYear.id,
              batch: studentBatch,
              intakeYear: intakeYear,
              departmentId: department.id,
              semesterId: semester.id,
              divisionId: division.id,
            },
          });
          addedRows++; // Increment for newly added rows
        }
      } catch (innerError: any) {
        // Catch any errors that occur during the processing of a single row.
        console.error(
          `Error processing row ${rowNumber} (Enrollment: ${enrollmentNumber}):`,
          innerError
        );
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
    res.status(200).json({
      message: 'Student data processing complete.',
      rowsAffected: addedRows + updatedRows,
    });
  } catch (error: any) {
    // Added type for error
    // Catch any top-level errors (e.g., file upload issues, workbook loading).
    console.error('Error processing student data:', error);
    res.status(500).json({
      message: 'Error processing student data',
      error: error.message || 'Unknown error',
    });
  } finally {
    // Clear all caches after processing to free up memory.
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();
  }
};
