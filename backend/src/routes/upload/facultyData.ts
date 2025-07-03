import multer from 'multer';
import ExcelJS from 'exceljs';
import { PrismaClient, Designation } from '@prisma/client'; // Import Designation enum
import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const COLLEGE_ID = 'LDRP-ITR';
const departmentCache = new Map();
const facultyCache = new Map(); // Not used for pre-fetching in this file, but kept for consistency if needed elsewhere.
const collegeCache = new Map();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
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
        images: {}, // Assuming this is a JSON field
      },
      update: {}, // No specific update needed if it exists
    });
    collegeCache.set(COLLEGE_ID, college);
  }
  return college;
}

// --- MODIFIED getCellValue to handle dates and numbers better ---
const getCellValue = (
  cell: ExcelJS.Cell
): string | number | Date | null | undefined => {
  const value = cell.value;

  if (value === null || value === undefined) {
    return null;
  }

  // If ExcelJS returns a Date object directly (most common for date cells)
  if (value instanceof Date) {
    return value;
  }

  // If it's a rich text object (e.g., cell with hyperlink)
  if (typeof value === 'object' && 'hyperlink' in value && 'text' in value) {
    return value.text || '';
  }

  // If it's a number (Excel stores dates as numbers, but ExcelJS often converts them)
  if (typeof value === 'number') {
    return value;
  }

  // For anything else, convert to string
  return value.toString();
};

// --- New helper function to format Date objects consistently for comparison ---
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

function parseDDMMYYYY(dateString: string): Date | null {
  if (!dateString) return null;

  // FIX: Replace slashes with hyphens to handle both DD-MM-YYYY and DD/MM/YYYY
  const normalizedDateString = dateString.replace(/\//g, '-');
  const parts = normalizedDateString.split('-');

  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
    const year = parseInt(parts[2], 10);

    // Basic validation for numbers
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      // Check if the constructed date is valid and matches the input parts
      // This handles cases like 31-02-2023 becoming March 2nd
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

router.post(
  '/',
  upload.single('facultyData'), // Expecting a single file named 'facultyData'
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1); // Get the first worksheet

      if (!worksheet) {
        res.status(400).json({ message: 'Invalid worksheet' });
        return;
      }

      const start_time = Date.now();

      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let unchangedCount = 0;

      const college = await ensureCollege(); // Ensure college record exists

      // Clear caches for a fresh import (important for subsequent requests)
      departmentCache.clear();
      facultyCache.clear(); // Clear faculty cache too
      collegeCache.clear(); // Clear college cache, it will be re-populated by ensureCollege

      // Iterate through rows, starting from the second row (assuming first row is header)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // --- UPDATED COLUMN INDICES FOR NEW EXCEL FORMAT ---
        const name = getCellValue(row.getCell(2))?.toString()?.trim() || ''; // Column B
        const email = getCellValue(row.getCell(3))?.toString()?.trim() || ''; // Column C
        const facultyKey =
          getCellValue(row.getCell(4))?.toString()?.trim() || ''; // Abbreviation (Column D)
        const designationString =
          getCellValue(row.getCell(5))?.toString()?.trim() || ''; // NEW: Designation (Column E)
        const deptName = row.getCell(6).value?.toString() || ''; // Department (Column F, shifted from E)
        const rawJoiningDateValue = getCellValue(row.getCell(7)); // Joining Date (Column G, shifted from F)
        // --- END UPDATED COLUMN INDICES ---

        // Skip row if essential data (name, email, department name) is missing
        if (!name || !email || !deptName) {
          console.warn(
            `Skipping row ${rowNumber}: Missing Name (B), Email (C), or Department (F).`
          );
          skippedCount++;
          continue;
        }

        // --- Map Designation String to Enum ---
        let facultyDesignation: Designation;
        switch (
          designationString.toLowerCase() // Convert to lowercase for robust matching
        ) {
          case 'head of department':
            facultyDesignation = Designation.HoD;
            break;
          case 'assistant professor':
            facultyDesignation = Designation.Asst_Prof;
            break;
          case 'lab assistant':
            facultyDesignation = Designation.Lab_Asst;
            break;
          default:
            console.warn(
              `Unknown designation '${designationString}' for faculty '${name}' (row ${rowNumber}). Defaulting to Asst_Prof.`
            );
            facultyDesignation = Designation.Asst_Prof; // Default or handle as an error
            break;
        }

        // --- Department Upsert Logic ---
        let department = departmentCache.get(deptName);
        if (!department) {
          let departmentFullName = deptName;
          // Map common abbreviations to full names if necessary
          const departmentMap: Record<string, string> = {
            'Computer Engineering': 'CE',
            'Information Technology': 'IT',
            'Electronics and Communication Engineering': 'ECE',
            'Mechanical Engineering': 'ME',
            'Civil Engineering': 'CIVIL',
            'Electrical Engineering': 'EE',
          };

          department = await prisma.department.upsert({
            where: {
              name_collegeId: {
                // Unique constraint on name and collegeId
                name: departmentFullName,
                collegeId: college.id,
              },
            },
            create: {
              name: departmentFullName,
              abbreviation: departmentMap[deptName] || deptName,
              hodName: `HOD of ${departmentFullName}`,
              hodEmail: `hod.${deptName.toLowerCase()}@ldrp.ac.in`,
              collegeId: college.id,
            },
            update: {}, // No specific update needed if department exists
          });

          if (department) {
            departmentCache.set(deptName, department); // Cache the department object
          }
        }

        if (!department) {
          console.warn(
            `Skipping row ${rowNumber}: Department '${deptName}' (Column F) could not be created or found.`
          );
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
          // Fallback: If it's a string, try parsing DD-MM-YYYY format
          const parsedDate = parseDDMMYYYY(rawJoiningDateValue.trim());
          if (parsedDate) {
            actualJoiningDate = parsedDate;
          } else {
            console.warn(
              `Skipping row ${rowNumber}: Invalid Joining Date string format (Column G): '${rawJoiningDateValue}'. Expected DD-MM-YYYY or DD/MM/YYYY if not a standard date cell.`
            );
            skippedCount++;
            continue;
          }
        } else if (
          rawJoiningDateValue !== null &&
          rawJoiningDateValue !== undefined
        ) {
          // Handle other unexpected types (e.g., numbers that aren't dates)
          console.warn(
            `Skipping row ${rowNumber}: Unexpected Joining Date value type (Column G): '${typeof rawJoiningDateValue}'. Value: ${rawJoiningDateValue}`
          );
          skippedCount++;
          continue;
        }
        // If rawJoiningDateValue is null/undefined, actualJoiningDate remains null, which is fine.

        // Prepare data for Faculty upsert/create
        const newFacultyData = {
          name: name,
          email: email,
          abbreviation: facultyKey || null, // Store empty string as null for abbreviation
          designation: facultyDesignation, // Use the mapped enum value
          seatingLocation: `${department.name} Department`, // Derived from department
          joiningDate: actualJoiningDate, // Use the parsed Date object or null
          departmentId: department.id,
        };

        // --- Faculty Upsert/Update Logic ---
        // Use email for findUnique as it's the reliable unique identifier.
        const existingFaculty = await prisma.faculty.findUnique({
          where: { email: newFacultyData.email }, // Lookup by unique email
          select: {
            id: true, // Need ID for update
            name: true,
            email: true,
            abbreviation: true, // Select abbreviation for comparison
            designation: true, // Select designation for comparison
            seatingLocation: true,
            joiningDate: true,
            departmentId: true,
          },
        });

        if (existingFaculty) {
          // Normalize existing data for comparison
          const existingNormalizedData = {
            name: existingFaculty.name?.trim() || '',
            email: existingFaculty.email?.trim() || '',
            abbreviation: existingFaculty.abbreviation || null, // Normalize null/undefined to null
            designation: existingFaculty.designation, // Enum value
            seatingLocation: existingFaculty.seatingLocation?.trim() || '',
            joiningDate: formatDateToYYYYMMDD(existingFaculty.joiningDate),
            departmentId: existingFaculty.departmentId,
          };

          // Normalize new data from Excel for comparison
          const newNormalizedData = {
            name: newFacultyData.name,
            email: newFacultyData.email,
            abbreviation: newFacultyData.abbreviation, // Already normalized to null
            designation: newFacultyData.designation, // Enum value
            seatingLocation: newFacultyData.seatingLocation,
            joiningDate: formatDateToYYYYMMDD(newFacultyData.joiningDate),
            departmentId: newFacultyData.departmentId,
          };

          // Compare individual fields to determine if an update is needed
          // Note: Enum comparison is direct. Nullable string comparison handles nulls.
          const isChanged =
            existingNormalizedData.name !== newNormalizedData.name ||
            existingNormalizedData.email !== newNormalizedData.email ||
            existingNormalizedData.abbreviation !==
              newNormalizedData.abbreviation || // Compare abbreviation
            existingNormalizedData.designation !==
              newNormalizedData.designation || // Compare enum designation
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
                email: newFacultyData.email,
                abbreviation: newFacultyData.abbreviation, // Pass null if empty
                designation: newFacultyData.designation, // Pass enum value
                seatingLocation: newFacultyData.seatingLocation,
                joiningDate: newFacultyData.joiningDate || undefined, // Send Date object or undefined for null
                departmentId: newFacultyData.departmentId,
              },
            });
            updatedCount++;
          } else {
            unchangedCount++;
          }
        } else {
          // Create new faculty record
          const facultyCreateData = {
            name: newFacultyData.name,
            email: newFacultyData.email,
            abbreviation: newFacultyData.abbreviation, // Pass null if empty
            designation: newFacultyData.designation, // Pass enum value
            seatingLocation: newFacultyData.seatingLocation,
            department: {
              connect: { id: newFacultyData.departmentId }, // Connect to existing department
            },
            joiningDate: newFacultyData.joiningDate || undefined, // Pass Date object or undefined for null
          };

          await prisma.faculty.create({
            data: facultyCreateData,
          });
          addedCount++;
        }

        // --- NEW LOGIC: Update HoD information if the current faculty is an HoD ---
        if (facultyDesignation === Designation.HoD) {
          // Only update if the department object is valid
          if (department) {
            // Check if the department's HOD name/email needs updating
            // This prevents unnecessary writes if the HOD data is already correct
            if (
              department.hodName !== newFacultyData.name ||
              department.hodEmail !== newFacultyData.email
            ) {
              try {
                await prisma.department.update({
                  where: { id: department.id },
                  data: {
                    hodName: newFacultyData.name,
                    hodEmail: newFacultyData.email,
                  },
                });
              } catch (updateError) {
                console.error(
                  `Error updating HOD for department ${department.name}:`,
                  updateError
                );
              }
            }
          }
        }
      }

      const end_time = Date.now();
      console.log(
        '🕒 Faculty data processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );
      console.log(
        `Summary: Added ${addedCount}, Updated ${updatedCount}, Unchanged ${unchangedCount}, Skipped ${skippedCount} rows.`
      );

      res.status(200).json({
        message: 'Faculty data import summary',
        rowsAffected: addedCount + updatedCount,
      });
    } catch (error) {
      console.error('Error processing faculty data:', error);
      res.status(500).json({
        message: 'Error processing faculty data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      // Clear caches after request completion
      departmentCache.clear();
      facultyCache.clear();
      collegeCache.clear();
    }
  }
);

export default router;
