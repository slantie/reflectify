import { Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch'; // Using node-fetch for HTTP requests
import prisma from '../../lib/prisma'; // Import the singleton Prisma client
import { SemesterTypeEnum } from '@prisma/client'; // Import SemesterTypeEnum

// Multer storage configuration for handling file uploads in memory
export const upload = multer({ storage: multer.memoryStorage() });

// Caches to reduce database lookups for frequently accessed entities
const collegeCache = new Map();
const departmentCache = new Map();
const academicYearCache = new Map();
const semesterCache = new Map();
const divisionCache = new Map();
const subjectCache = new Map();
const facultyCache = new Map();

// Configuration constants
const FLASK_SERVER =
  process.env.NODE_ENV === 'development'
    ? process.env.FLASK_DEV_SERVER
    : process.env.FLASK_PROD_SERVER;
const COLLEGE_ID = 'LDRP-ITR'; // Hardcoded college ID

// --- Interfaces for data structures (kept as is) ---
interface ApiError extends Error {
  status?: number;
  type?: string;
}

interface FacultyAssignment {
  designated_faculty: string;
}

interface SubjectAllocationData {
  lectures?: {
    designated_faculty: string;
  };
  labs?: {
    [batch: string]: FacultyAssignment;
  };
}

interface DivisionData {
  [subjectAbbreviation: string]: SubjectAllocationData;
}

interface SemesterData {
  [divisionName: string]: DivisionData;
}

interface DepartmentData {
  [semesterNumber: string]: SemesterData;
}

interface CollegeData {
  [departmentName: string]: DepartmentData;
}

interface ProcessedData {
  [collegeName: string]: CollegeData;
}

interface AllocationBatchItem {
  departmentId: string;
  facultyId: string;
  subjectId: string;
  divisionId: string;
  semesterId: string;
  lectureType: 'LECTURE' | 'LAB';
  batch: string;
  academicYearId: string;
  isDeleted: boolean; // Added isDeleted field
}

// --- Canonical Department Mapping (re-used from other controllers) ---
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

// --- Helper Functions ---

/**
 * Fetches data from a given URL with retry logic.
 * @param {string} url - The URL to fetch from.
 * @param {object} options - Fetch options (method, headers, body).
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<any>} The parsed JSON response.
 * @throws {ApiError} If the fetch fails after max retries or returns a non-OK status.
 */
const fetchWithRetry = async (
  url: string,
  options: any,
  maxRetries = 3
): Promise<any> => {
  if (!url) {
    throw new Error('Flask server URL is not defined.');
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const text = await response.text(); // Read as text first to handle non-JSON errors

      if (!response.ok) {
        // Attempt to parse JSON error from Flask, or use plain text
        try {
          const errorJson = JSON.parse(text);
          throw new Error(
            `Flask server error: ${errorJson.message || JSON.stringify(errorJson)}`
          );
        } catch {
          throw new Error(`Flask server error: ${text || response.statusText}`);
        }
      }

      return JSON.parse(text); // Parse JSON if response is OK
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Fetch attempt ${i + 1} failed:`, apiError.message); // Keep this error for production debugging
      if (i === maxRetries - 1) {
        throw apiError;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('Failed to fetch data after multiple retries.'); // Should not be reached
};

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
 * Ensures the College record exists in the database and caches it.
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
      update: {}, // No specific update data needed if it already exists
    });
    collegeCache.set(COLLEGE_ID, college);
  }
  return college;
}

/**
 * @description Handles the upload and processing of the faculty matrix Excel file.
 * It extracts data, interacts with a Flask server for processing, and updates the database.
 * This function is designed to be used as an Express route handler AFTER Multer processes the file.
 * @route POST /api/upload/faculty-matrix
 * @param {Request} req - Express Request object (expects req.file to be populated by Multer)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const uploadFacultyMatrix = async (
  req: Request,
  res: Response
): Promise<void> => {
  const batchSize = 500; // Number of allocations to process in a single Prisma createMany operation
  let allocationBatch: AllocationBatchItem[] = [];
  let totalAllocationsAdded = 0; // Counts successfully added allocations (not duplicates)
  let totalRowsSkippedDueToMissingEntities = 0; // Counts rows from Flask output where subject or faculty could not be found
  const skippedRowsDetails: string[] = []; // Array to store details of skipped rows for frontend

  // --- NEW: Get academicYearString and semesterType from request body ---
  const academicYearString = req.body.academicYear as string;
  const semesterRunInput = req.body.semesterRun as string; // e.g., "ODD" or "EVEN"
  // --- END NEW ---

  try {
    // Validate required inputs, including the new fields
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded or file processing failed by multer.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }
    if (!req.body.deptAbbreviation) {
      res.status(400).json({
        success: false,
        message: 'Department abbreviation is required.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }
    if (!academicYearString) {
      res.status(400).json({
        success: false,
        message: 'Academic Year is required.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }
    if (!semesterRunInput) {
      res.status(400).json({
        success: false,
        message: 'Semester Run (Odd/Even) is required.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }
    if (!FLASK_SERVER) {
      res.status(500).json({
        success: false,
        message: 'Flask server URL is not configured.',
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }

    // Validate semesterRunInput against SemesterTypeEnum
    let semesterType: SemesterTypeEnum;
    if (semesterRunInput.toUpperCase() === SemesterTypeEnum.ODD) {
      semesterType = SemesterTypeEnum.ODD;
    } else if (semesterRunInput.toUpperCase() === SemesterTypeEnum.EVEN) {
      semesterType = SemesterTypeEnum.EVEN;
    } else {
      res.status(400).json({
        success: false,
        message: `Invalid Semester Run value: '${semesterRunInput}'. Must be 'ODD' or 'EVEN'.`,
        skippedRowsDetails: skippedRowsDetails,
      });
      return;
    }

    // Clear caches at the beginning of the request to ensure fresh data
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();
    subjectCache.clear();
    facultyCache.clear();

    // Ensure college record exists
    const college = await ensureCollege();

    // Find the AcademicYear for the provided academicYearString (crucial pre-check)
    const academicYear = await findAcademicYear(academicYearString);
    if (!academicYear) {
      const message = `Academic Year '${academicYearString}' not found. Please create it first via the Academic Year management API before uploading faculty matrix.`;
      console.error(message);
      if (!res.headersSent) {
        res.status(400).json({
          success: false,
          message: message,
          skippedRowsDetails: skippedRowsDetails,
        });
      }
      return;
    }

    // Find the department based on the provided abbreviation and college ID
    let department = departmentCache.get(req.body.deptAbbreviation);
    if (!department) {
      let canonicalDept =
        DEPARTMENT_MAPPING[req.body.deptAbbreviation.toUpperCase()];
      if (!canonicalDept) {
        // Fallback to searching by full name if abbreviation not found
        for (const key in DEPARTMENT_MAPPING) {
          if (
            DEPARTMENT_MAPPING[key].name.toLowerCase() ===
            req.body.deptAbbreviation.toLowerCase()
          ) {
            canonicalDept = DEPARTMENT_MAPPING[key];
            break;
          }
        }
      }
      const deptNameToSearch = canonicalDept
        ? canonicalDept.name
        : req.body.deptAbbreviation;

      department = await prisma.department.findFirst({
        where: {
          OR: [
            { abbreviation: req.body.deptAbbreviation, isDeleted: false },
            { name: deptNameToSearch, isDeleted: false },
          ],
          collegeId: COLLEGE_ID,
        },
      });

      if (department) {
        departmentCache.set(req.body.deptAbbreviation, department);
      }
    }

    if (!department) {
      const message = `Department '${req.body.deptAbbreviation}' not found for College '${COLLEGE_ID}'. Please ensure the department exists and is not soft-deleted.`;
      console.error(message);
      if (!res.headersSent) {
        res.status(400).json({
          success: false,
          message: message,
          skippedRowsDetails: skippedRowsDetails,
        });
      }
      return;
    }

    // Prepare form data to send to Flask server
    const formData = new FormData();
    formData.append('facultyMatrix', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('deptAbbreviation', req.body.deptAbbreviation);
    // --- NEW: Pass academicYear and semesterRun to Flask if needed by Flask ---
    formData.append('academicYear', academicYearString);
    formData.append('semesterRun', semesterRunInput);
    // --- END NEW ---

    // Send the Excel file to the Flask server for processing
    const processedData = (await fetchWithRetry(`${FLASK_SERVER}`, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        Accept: 'application/json',
      },
      body: formData,
    })) as ProcessedData;

    const processingStartTime = Date.now(); // Renamed to avoid conflict with outer startTime

    // Iterate through the processed data received from the Flask server
    for (const [collegeName, collegeData] of Object.entries(processedData)) {
      for (const [deptName, deptData] of Object.entries(collegeData)) {
        for (const [semesterNum, semesterData] of Object.entries(deptData)) {
          const parsedSemesterNum = parseInt(semesterNum);
          if (isNaN(parsedSemesterNum)) {
            const message = `Skipping invalid semester number: '${semesterNum}' found in Flask data for department '${deptName}'.`;
            console.warn(message);
            skippedRowsDetails.push(message);
            totalRowsSkippedDueToMissingEntities++;
            continue;
          }

          // The semesterType is now determined from the request body, not derived from parsedSemesterNum
          // However, we still need to ensure the semester number matches the semester type (e.g., 1,3,5,7 for ODD)
          const expectedSemesterType =
            parsedSemesterNum % 2 !== 0
              ? SemesterTypeEnum.ODD
              : SemesterTypeEnum.EVEN;
          if (expectedSemesterType !== semesterType) {
            const message = `Skipping semester data for Semester ${parsedSemesterNum} (expected ${expectedSemesterType}): Mismatch with provided Semester Run '${semesterRunInput}'.`;
            console.warn(message);
            skippedRowsDetails.push(message);
            totalRowsSkippedDueToMissingEntities++;
            continue;
          }

          // Ensure Semester exists or create it.
          // Use the new unique constraint and soft-delete filter
          let semester = semesterCache.get(
            `${department.id}_${parsedSemesterNum}_${academicYear.id}_${semesterType}`
          );
          if (!semester) {
            semester = await prisma.semester.upsert({
              where: {
                departmentId_semesterNumber_academicYearId_semesterType: {
                  departmentId: department.id,
                  semesterNumber: parsedSemesterNum,
                  academicYearId: academicYear.id,
                  semesterType: semesterType,
                },
                isDeleted: false, // Filter out soft-deleted semesters
              },
              create: {
                departmentId: department.id,
                semesterNumber: parsedSemesterNum,
                academicYearId: academicYear.id,
                semesterType: semesterType,
                isDeleted: false, // Ensure new semester is not soft-deleted
              },
              update: {
                semesterType: semesterType, // Ensure consistency if found
              },
            });
            semesterCache.set(
              `${department.id}_${parsedSemesterNum}_${academicYear.id}_${semesterType}`,
              semester
            );
          }

          for (const [divisionName, divisionData] of Object.entries(
            semesterData
          )) {
            // Ensure Division exists or create it.
            // Add isDeleted filter
            let division = divisionCache.get(
              `${department.id}_${divisionName}_${semester.id}`
            );
            if (!division) {
              division = await prisma.division.upsert({
                where: {
                  departmentId_divisionName_semesterId: {
                    departmentId: department.id,
                    divisionName: divisionName,
                    semesterId: semester.id,
                  },
                  isDeleted: false, // Filter out soft-deleted divisions
                },
                create: {
                  departmentId: department.id,
                  semesterId: semester.id,
                  divisionName: divisionName,
                  studentCount: 0, // Default student count
                  isDeleted: false, // Ensure new division is not soft-deleted
                },
                update: {},
              });
              divisionCache.set(
                `${department.id}_${divisionName}_${semester.id}`,
                division
              );
            }

            for (const [subjectAbbreviation, subjectData] of Object.entries(
              divisionData
            )) {
              // Fetch Subject by departmentId and abbreviation (from cache or DB)
              // Add isDeleted filter
              let subject = subjectCache.get(
                `${department.id}_${subjectAbbreviation}`
              );
              if (!subject) {
                subject = await prisma.subject.findFirst({
                  where: {
                    departmentId: department.id,
                    abbreviation: subjectAbbreviation,
                    isDeleted: false, // Filter out soft-deleted subjects
                  },
                });
                if (subject) {
                  subjectCache.set(
                    `${department.id}_${subjectAbbreviation}`,
                    subject
                  );
                }
              }

              if (!subject) {
                const message = `Skipping subject allocation for Dept '${department.abbreviation}', Semester '${parsedSemesterNum}', Division '${divisionName}': Subject with abbreviation '${subjectAbbreviation}' not found or is soft-deleted.`;
                console.warn(message);
                skippedRowsDetails.push(message);
                totalRowsSkippedDueToMissingEntities++;
                continue; // Skip to next subject if not found
              }

              // Process Lectures
              if (subjectData.lectures) {
                const facultyAbbr = subjectData.lectures.designated_faculty;
                let faculty = facultyCache.get(
                  `${department.id}_${facultyAbbr}`
                );
                if (!faculty) {
                  faculty = await prisma.faculty.findFirst({
                    where: {
                      departmentId: department.id,
                      abbreviation: facultyAbbr,
                      isDeleted: false, // Filter out soft-deleted faculty
                    },
                  });
                  if (faculty) {
                    facultyCache.set(
                      `${department.id}_${facultyAbbr}`,
                      faculty
                    );
                  }
                }

                if (faculty) {
                  const lectureAllocation: AllocationBatchItem = {
                    departmentId: department.id,
                    facultyId: faculty.id,
                    subjectId: subject.id,
                    divisionId: division.id,
                    semesterId: semester.id,
                    lectureType: 'LECTURE',
                    batch: '-', // Default batch for lectures
                    academicYearId: academicYear.id,
                    isDeleted: false, // New allocation is not soft-deleted
                  };
                  allocationBatch.push(lectureAllocation);
                } else {
                  const message = `Skipping lecture allocation for Subject '${subjectAbbreviation}', Division '${divisionName}': Faculty with abbreviation '${facultyAbbr}' not found or is soft-deleted for department '${department.abbreviation}'.`;
                  console.warn(message);
                  skippedRowsDetails.push(message);
                  totalRowsSkippedDueToMissingEntities++;
                }
              }

              // Process Labs
              if (subjectData.labs) {
                for (const [batch, labData] of Object.entries(
                  subjectData.labs
                )) {
                  const facultyAbbr = labData.designated_faculty;
                  let faculty = facultyCache.get(
                    `${department.id}_${facultyAbbr}`
                  );
                  if (!faculty) {
                    faculty = await prisma.faculty.findFirst({
                      where: {
                        departmentId: department.id,
                        abbreviation: facultyAbbr,
                        isDeleted: false, // Filter out soft-deleted faculty
                      },
                    });
                    if (faculty) {
                      facultyCache.set(
                        `${department.id}_${facultyAbbr}`,
                        faculty
                      );
                    }
                  }

                  if (faculty) {
                    const labAllocation: AllocationBatchItem = {
                      departmentId: department.id,
                      facultyId: faculty.id,
                      subjectId: subject.id,
                      divisionId: division.id,
                      semesterId: semester.id,
                      lectureType: 'LAB',
                      batch: batch,
                      academicYearId: academicYear.id,
                      isDeleted: false, // New allocation is not soft-deleted
                    };
                    allocationBatch.push(labAllocation);
                  } else {
                    const message = `Skipping lab allocation for Subject '${subjectAbbreviation}', Division '${divisionName}', Batch '${batch}': Faculty with abbreviation '${facultyAbbr}' not found or is soft-deleted for department '${department.abbreviation}'.`;
                    console.warn(message);
                    skippedRowsDetails.push(message);
                    totalRowsSkippedDueToMissingEntities++;
                  }
                }
              }

              // Check batch size and insert allocations
              if (allocationBatch.length >= batchSize) {
                const result = await prisma.subjectAllocation.createMany({
                  data: allocationBatch,
                  skipDuplicates: true, // Allocations that are exact duplicates will be skipped by Prisma
                });
                totalAllocationsAdded += result.count;
                allocationBatch = []; // Reset batch
              }
            }
          }
        }
      }
    }

    // Insert any remaining allocations in the final batch
    if (allocationBatch.length > 0) {
      const result = await prisma.subjectAllocation.createMany({
        data: allocationBatch,
        skipDuplicates: true,
      });
      totalAllocationsAdded += result.count;
    }

    const endTime = Date.now();
    console.log(
      '🕒 Faculty Matrix processing completed in',
      ((endTime - processingStartTime) / 1000).toFixed(2), // Use processingStartTime
      'seconds'
    );

    res.status(200).json({
      success: true,
      message: 'Faculty matrix import complete.',
      rowsAffected: totalAllocationsAdded,
    });
  } catch (error: any) {
    console.error('Processing error for faculty matrix:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to process faculty matrix',
        error: error.message || 'Unknown error',
        skippedRowsDetails: skippedRowsDetails, // Include details even on top-level error
      });
    }
  } finally {
    // Clear all caches after processing to free up memory
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();
    subjectCache.clear();
    facultyCache.clear();
  }
};
