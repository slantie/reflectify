import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const COLLEGE_ID = 'LDRP-ITR';
const collegeCache = new Map();
const departmentCache = new Map();
const academicYearCache = new Map(); // Cache for AcademicYear
const semesterCache = new Map();
const divisionCache = new Map();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

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
      update: {}, // No specific update data needed if it already exists
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

// POST endpoint for uploading student data
router.post(
  '/',
  upload.single('studentData'), // 'studentData' is the field name for the uploaded file
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer); // Load the Excel file from the buffer
      const worksheet = workbook.getWorksheet(1); // Get the first worksheet

      if (!worksheet) {
        res.status(400).json({ message: 'Invalid worksheet' });
        return;
      }

      const start_time = Date.now();

      // Array to store the processing status of each row (for internal details/debugging)
      const processedRows: {
        enrollmentNumber: string;
        status: string;
        error?: string;
      }[] = [];
      let updatedRows = 0; // Renamed from updatedCount, for actual changes
      let addedRows = 0; // Renamed from createdCount, for new rows
      let skippedCount = 0; // Still tracks skipped rows for internal logging

      // Iterate over rows, starting from the second row (assuming first is header)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Extract data from specific columns
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
          processedRows.push({
            enrollmentNumber,
            status: 'skipped (missing data)',
          });
          continue; // Skip to the next row if essential data is missing
        }

        const semesterNumber = parseInt(semesterNumberStr);
        if (isNaN(semesterNumber)) {
          console.warn(
            `Skipping row ${rowNumber} due to invalid Semester Number: ${semesterNumberStr}`
          );
          skippedCount++;
          processedRows.push({
            enrollmentNumber,
            status: 'skipped (invalid semester number)',
          });
          continue; // Skip if semester number is not a valid integer
        }

        try {
          // Ensure College, Department, AcademicYear, Semester, and Division records exist
          // These operations use upsert and caching to optimize performance.
          const college = await ensureCollege();

          let department = departmentCache.get(deptAbbreviation);
          if (!department) {
            let departmentName = deptAbbreviation;
            // Map abbreviations to full department names
            if (deptAbbreviation === 'CE') {
              departmentName = 'Computer Engineering';
            } else if (deptAbbreviation === 'IT') {
              departmentName = 'Information Technology';
            } else if (deptAbbreviation === 'EC') {
              departmentName = 'Electronics & Communication Engineering';
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

          // --- REVISED Student Processing Logic to prioritize email for updates and count actual changes ---
          let studentRecord = await prisma.student.findUnique({
            where: { email: email }, // Try to find student by email first
          });

          if (studentRecord) {
            // Student record found by email, attempt to update it.

            // Prepare data for update and check for actual changes
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
                // (who has a different email). We cannot reassign this enrollment number.
                console.warn(
                  `Skipping update for student with email ${email}: New enrollment number '${enrollmentNumber}' is already taken by another student (${existingStudentWithNewEnrollmentNumber.enrollmentNumber}).`
                );
                skippedCount++;
                processedRows.push({
                  enrollmentNumber,
                  status: 'skipped (enrollment number conflict)',
                });
                continue; // Skip this row to prevent unique constraint violation
              }
              dataToUpdate.enrollmentNumber = enrollmentNumber;
              hasChanges = true;
            }

            if (studentRecord.phoneNumber !== email) {
              // Assuming phoneNumber is email
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
              processedRows.push({ enrollmentNumber, status: 'updated' });
            } else {
              // No changes detected, mark as unchanged
              processedRows.push({ enrollmentNumber, status: 'unchanged' });
            }
          } else {
            // Student record not found by email. Now, check if the enrollment number is already taken.
            const existingStudentByEnrollmentNumber =
              await prisma.student.findUnique({
                where: { enrollmentNumber: enrollmentNumber },
              });

            if (existingStudentByEnrollmentNumber) {
              // Conflict: The enrollment number from Excel is already taken by an existing student,
              // but the email is new. This indicates a data inconsistency or an attempt to create a
              // new student with an enrollment number already assigned to someone else.
              console.warn(
                `Skipping creation for student ${enrollmentNumber}: Enrollment number '${enrollmentNumber}' is already taken by an existing student (${existingStudentByEnrollmentNumber.email}), but the email '${email}' is new.`
              );
              skippedCount++;
              processedRows.push({
                enrollmentNumber,
                status: 'skipped (enrollment number taken by different email)',
              });
              continue; // Skip this row
            }

            // If neither email nor enrollment number exists, create a new student.
            await prisma.student.create({
              data: {
                name: studentName,
                enrollmentNumber: enrollmentNumber,
                email: email,
                phoneNumber: email,
                academicYearId: academicYear.id,
                batch: studentBatch,
                intakeYear: intakeYear,
                departmentId: department.id,
                semesterId: semester.id,
                divisionId: division.id,
              },
            });
            addedRows++; // Increment for newly added rows
            processedRows.push({ enrollmentNumber, status: 'created' });
          }
          // --- End of REVISED Student Processing Logic ---
        } catch (innerError: any) {
          // Catch any errors that occur during the processing of a single row.
          console.error(
            `Error processing row ${rowNumber} (Enrollment: ${enrollmentNumber}):`,
            innerError
          );
          skippedCount++;
          processedRows.push({
            enrollmentNumber,
            status: 'failed',
            error: innerError.message,
          });
        }
      }

      const end_time = Date.now();
      console.log(
        '🕒 Student data processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );

      // Send a simplified summary response back to the client.
      res.status(200).json({
        message: 'Student data processing complete.',
        rowsAffected: updatedRows + addedRows,
      });
    } catch (error) {
      // Catch any top-level errors (e.g., file upload issues, workbook loading).
      console.error('Error:', error);
      res.status(500).json({
        message: 'Error processing student data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      // Clear all caches after processing to free up memory.
      departmentCache.clear();
      semesterCache.clear();
      divisionCache.clear();
      collegeCache.clear();
      academicYearCache.clear();
    }
  }
);

export default router;
