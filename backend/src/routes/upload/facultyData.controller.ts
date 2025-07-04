import { Request, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma'; // Import the singleton Prisma client
import { Designation } from '@prisma/client'; // Import Designation enum

// Multer configuration for file uploads
export const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Caches to reduce database lookups for frequently accessed entities
const COLLEGE_ID = 'LDRP-ITR'; // Assuming this is a constant for your college
const collegeCache = new Map();
const departmentCache = new Map();
const facultyCache = new Map();

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
        images: {}, // Assuming this is a JSON field
        isDeleted: false, // Ensure new college is not soft-deleted
      },
      update: {}, // No specific update needed if it exists
    });
    collegeCache.set(COLLEGE_ID, college);
  }
  return college;
}

/**
 * Extracts the string, number, or Date value from an ExcelJS cell, handling rich text and hyperlinks.
 * Returns null for empty or undefined cells.
 * @param {ExcelJS.Cell} cell - The ExcelJS cell object.
 * @returns {string | number | Date | null} The value of the cell, or null if empty/undefined.
 */
const getCellValue = (cell: ExcelJS.Cell): string | number | Date | null => {
  const value = cell.value;

  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && 'hyperlink' in value && 'text' in value) {
    return value.text?.toString() || null; // Return null if text is empty for hyperlink cells
  }

  if (typeof value === 'number') {
    return value;
  }

  return value.toString();
};

/**
 * Formats a Date object to a YYYY-MM-DD string for consistent comparison.
 * @param {Date | null} date - The date to format.
 * @returns {string} The formatted date string, or an empty string if null/invalid.
 */
function formatDateToYYYYMMDD(date: Date | null): string {
  if (!date) return '';
  try {
    const d = new Date(date); // Ensure it's a valid Date object
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting date:', date, e);
    return '';
  }
}

/**
 * Parses a date string in DD-MM-YYYY or DD/MM/YYYY format into a Date object.
 * @param {string} dateString - The date string to parse.
 * @returns {Date | null} The parsed Date object, or null if invalid.
 */
function parseDDMMYYYY(dateString: string): Date | null {
  if (!dateString) return null;

  const normalizedDateString = dateString.replace(/\//g, '-');
  const parts = normalizedDateString.split('-');

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      // Validate if the parsed date components match the input to prevent invalid date conversions
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }
  return null;
}

/**
 * @description Handles the upload and processing of faculty data from an Excel file.
 * It reads faculty details, ensures related department entities exist, and
 * creates or updates faculty records in the database. It also updates HOD info.
 * This function is designed to be used as an Express route handler AFTER Multer processes the file.
 * @param {Request} req - Express Request object (expects req.file to be populated by Multer)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const uploadFacultyData = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Initialize these variables at the top to ensure they are always available for the final response
  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let skippedCount = 0;
  const skippedRowsDetails: string[] = [];

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
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet

    if (!worksheet) {
      res.status(400).json({
        message: 'Invalid worksheet: Worksheet not found in the Excel file.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }

    const startTime = Date.now();

    // Ensure college record exists and get its ID
    const college = await ensureCollege();

    // Clear caches for a fresh import (important for subsequent requests)
    departmentCache.clear();
    facultyCache.clear();
    collegeCache.clear(); // Clear college cache, it will be re-populated by ensureCollege

    // Iterate through rows, starting from the second row (assuming first row is header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Extract data from specific columns based on your Excel template
      const name = getCellValue(row.getCell(2))?.toString()?.trim() || ''; // Column B
      const email =
        getCellValue(row.getCell(3))?.toString()?.trim()?.toLowerCase() || ''; // Column C - IMPORTANT: Normalize to lowercase
      const facultyAbbreviation =
        getCellValue(row.getCell(4))?.toString()?.trim() || ''; // Abbreviation (Column D)
      const designationString =
        getCellValue(row.getCell(5))?.toString()?.trim() || ''; // Designation (Column E)
      const deptInput = getCellValue(row.getCell(6))?.toString()?.trim() || ''; // Department (Column F) - Renamed to deptInput

      const rawJoiningDateValue = getCellValue(row.getCell(7)); // Joining Date (Column G)

      // --- Detailed Validation and Skipping ---
      const missingFields: string[] = [];
      if (!name) missingFields.push('Name (B)');
      if (!email) missingFields.push('Email (C)');
      if (!deptInput) missingFields.push('Department (F)');

      if (missingFields.length > 0) {
        const message = `Row ${rowNumber}: Skipping due to missing essential data: ${missingFields.join(', ')}. Row data: Name='${name}', Email='${email}', Dept='${deptInput}'.`;
        console.warn(message);
        skippedRowsDetails.push(message);
        skippedCount++;
        continue;
      }

      // Map Designation String to Enum (UPDATED to match schema enum values)
      let facultyDesignation: Designation;
      const lowerCaseDesignation = designationString.toLowerCase();
      switch (lowerCaseDesignation) {
        case 'hod':
        case 'head of department': // Allow both for flexibility
          facultyDesignation = Designation.HOD;
          break;
        case 'asstprof':
        case 'assistant professor': // Allow both
          facultyDesignation = Designation.AsstProf;
          break;
        case 'labasst':
        case 'lab assistant': // Allow both
          facultyDesignation = Designation.LabAsst;
          break;
        default:
          const message = `Row ${rowNumber}: Unknown designation '${designationString}' for faculty '${name}'. Defaulting to AsstProf.`;
          console.warn(message);
          skippedRowsDetails.push(message); // Log this as a warning for the user
          facultyDesignation = Designation.AsstProf; // Default or handle as an error
          break;
      }

      try {
        // --- Department Upsert Logic (Revised for Consistency and soft-delete) ---
        let department = departmentCache.get(deptInput); // Try to get from cache using original input string
        let canonicalDept: { name: string; abbreviation: string } | undefined;

        if (!department) {
          // Attempt to find canonical department details from our mapping
          canonicalDept = DEPARTMENT_MAPPING[deptInput.toUpperCase()]; // Use uppercase for map key lookup

          if (!canonicalDept) {
            // If not found as an abbreviation, check if it's a full name
            for (const key in DEPARTMENT_MAPPING) {
              if (
                DEPARTMENT_MAPPING[key].name.toLowerCase() ===
                deptInput.toLowerCase()
              ) {
                canonicalDept = DEPARTMENT_MAPPING[key];
                break;
              }
            }
          }

          if (!canonicalDept) {
            // If still not found in our predefined map, use the input as is, but warn
            const message = `Row ${rowNumber}: Department '${deptInput}' not found in predefined mapping. Using input as canonical.`;
            console.warn(message);
            skippedRowsDetails.push(message); // Add warning to details
            canonicalDept = { name: deptInput, abbreviation: deptInput }; // Fallback to using input as both
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
          departmentCache.set(deptInput, department); // Cache using the original input string for future lookups in this request
        }

        if (!department) {
          const message = `Row ${rowNumber}: Department '${deptInput}' (Column F) could not be created or found after all attempts.`;
          console.warn(message);
          skippedRowsDetails.push(message);
          skippedCount++;
          continue;
        }

        // --- Handle Joining Date Parsing ---
        let actualJoiningDate: Date | null = null;

        if (rawJoiningDateValue instanceof Date) {
          actualJoiningDate = rawJoiningDateValue;
        } else if (
          typeof rawJoiningDateValue === 'string' &&
          rawJoiningDateValue.trim() !== ''
        ) {
          const parsedDate = parseDDMMYYYY(rawJoiningDateValue.trim());
          if (parsedDate) {
            actualJoiningDate = parsedDate;
          } else {
            const message = `Row ${rowNumber}: Invalid Joining Date string format (Column G): '${rawJoiningDateValue}'. Expected DD-MM-YYYY or DD/MM/YYYY if not a standard date cell.`;
            console.warn(message);
            skippedRowsDetails.push(message);
            skippedCount++;
            continue;
          }
        }
        // If rawJoiningDateValue is null/undefined, actualJoiningDate remains null, which is fine.

        // Prepare data for Faculty upsert/create
        const newFacultyData = {
          name: name,
          email: email, // Use the normalized lowercase email
          abbreviation: facultyAbbreviation || null, // Store empty string as null for abbreviation
          designation: facultyDesignation, // Use the mapped enum value
          seatingLocation: `${department.name} Department`, // Derived from department
          joiningDate: actualJoiningDate, // Use the parsed Date object or null
          departmentId: department.id,
        };

        // --- Faculty Upsert/Update Logic (with soft-delete filter) ---
        const existingFaculty = await prisma.faculty.findUnique({
          where: { email: newFacultyData.email, isDeleted: false }, // Lookup by unique (normalized) email, filter out soft-deleted
          select: {
            id: true, // Need ID for update
            name: true,
            email: true,
            abbreviation: true,
            designation: true,
            seatingLocation: true,
            joiningDate: true,
            departmentId: true,
          },
        });

        if (existingFaculty) {
          // Normalize existing data for comparison (trim strings and lowercase email)
          const existingNormalizedData = {
            name: existingFaculty.name?.trim() || '',
            email: existingFaculty.email?.trim()?.toLowerCase() || '', // Normalize existing email
            abbreviation: existingFaculty.abbreviation || null, // Normalize null/undefined to null
            designation: existingFaculty.designation, // Enum value
            seatingLocation: existingFaculty.seatingLocation?.trim() || '',
            joiningDate: formatDateToYYYYMMDD(existingFaculty.joiningDate),
            departmentId: existingFaculty.departmentId,
          };

          // Normalize new data from Excel for comparison
          const newNormalizedData = {
            name: newFacultyData.name,
            email: newFacultyData.email, // Already normalized
            abbreviation: newFacultyData.abbreviation, // Already normalized to null
            designation: newFacultyData.designation, // Enum value
            seatingLocation: newFacultyData.seatingLocation,
            joiningDate: formatDateToYYYYMMDD(newFacultyData.joiningDate),
            departmentId: newFacultyData.departmentId,
          };

          // Compare individual fields to determine if an update is needed
          const isChanged =
            existingNormalizedData.name !== newNormalizedData.name ||
            existingNormalizedData.email !== newNormalizedData.email || // Compare normalized emails
            existingNormalizedData.abbreviation !==
              newNormalizedData.abbreviation ||
            existingNormalizedData.designation !==
              newNormalizedData.designation ||
            existingNormalizedData.seatingLocation !==
              newNormalizedData.seatingLocation ||
            existingNormalizedData.joiningDate !==
              newNormalizedData.joiningDate ||
            existingNormalizedData.departmentId !==
              newNormalizedData.departmentId;

          if (isChanged) {
            await prisma.faculty.update({
              where: { id: existingFaculty.id }, // Update by ID for robustness
              data: {
                name: newFacultyData.name,
                email: newFacultyData.email, // Store normalized email
                abbreviation: newFacultyData.abbreviation, // Pass null if empty
                designation: newFacultyData.designation, // Pass enum value
                seatingLocation: newFacultyData.seatingLocation,
                joiningDate: newFacultyData.joiningDate || undefined, // Send Date object or undefined for null
                departmentId: newFacultyData.departmentId,
                isDeleted: false, // Ensure it's not soft-deleted if it was for some reason
              },
            });
            updatedCount++;
          } else {
            unchangedCount++;
          }
        } else {
          // Create new faculty record
          await prisma.faculty.create({
            data: {
              name: newFacultyData.name,
              email: newFacultyData.email, // Store normalized email
              abbreviation: newFacultyData.abbreviation, // Pass null if empty
              designation: newFacultyData.designation, // Pass enum value
              seatingLocation: newFacultyData.seatingLocation,
              department: {
                connect: { id: newFacultyData.departmentId }, // Connect to existing department
              },
              joiningDate: newFacultyData.joiningDate || undefined, // Pass Date object or undefined for null
              isDeleted: false, // Ensure new faculty is not soft-deleted
            },
          });
          addedCount++;
        }

        // --- Update HoD information if the current faculty is an HoD ---
        if (facultyDesignation === Designation.HOD) {
          // Use HOD enum value
          // Only update if the department object is valid and HOD info is different
          // Fetch the department again with hodName and hodEmail to ensure latest state for comparison
          const currentDepartment = await prisma.department.findUnique({
            where: { id: department.id, isDeleted: false }, // Filter out soft-deleted departments
            select: { hodName: true, hodEmail: true },
          });

          if (
            currentDepartment &&
            (currentDepartment.hodName !== newFacultyData.name ||
              currentDepartment.hodEmail !== newFacultyData.email)
          ) {
            try {
              await prisma.department.update({
                where: { id: department.id },
                data: {
                  hodName: newFacultyData.name,
                  hodEmail: newFacultyData.email,
                },
              });
            } catch (updateError: any) {
              // Add type for updateError
              const message = `Row ${rowNumber}: Error updating HOD for department ${department.name}: ${updateError.message || 'Unknown error'}.`;
              console.error(message, updateError);
              skippedRowsDetails.push(message); // Add to details for frontend
              // Do not increment skippedCount here as the faculty record itself was processed
            }
          }
        }
      } catch (innerError: any) {
        // Catch any errors that occur during the processing of a single row.
        const message = `Row ${rowNumber}: Error processing data for Email '${email || 'N/A'}': ${innerError.message || 'Unknown error'}.`;
        console.error(message, innerError); // Log full error for backend debugging
        skippedRowsDetails.push(message);
        skippedCount++;
      }
    }

    const endTime = Date.now();
    console.log(
      '🕒 Faculty data processing completed in',
      ((endTime - startTime) / 1000).toFixed(2),
      'seconds'
    );

    // Send a summary response back to the client.
    // This is the ONLY place a success response is sent.
    res.status(200).json({
      message: 'Faculty data import complete.',
      rowsAffected: addedCount + updatedCount,
    });
  } catch (error: any) {
    // Catch any top-level errors (e.g., file upload issues, workbook loading).
    console.error('Error processing faculty data:', error);
    // Ensure response is only sent if headers haven't been sent already
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error processing faculty data',
        error: error.message || 'Unknown error',
        skippedRowsDetails: skippedRowsDetails, // Include details even on top-level error if any were collected
      });
    }
  } finally {
    // Clear caches after request completion
    collegeCache.clear();
    departmentCache.clear();
    facultyCache.clear();
  }
};
