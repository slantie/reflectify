import { Request, Response } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch'; // Using node-fetch for HTTP requests
import prisma from '../../lib/prisma'; // Import the singleton Prisma client

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

// --- Interfaces for data structures ---
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
}

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
 * Ensures the College record exists in the database and caches it.
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
      update: {},
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

  // Determine the current academic year string (e.g., "2024-2025")
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (Jan=0, Dec=11)
  let currentYear = now.getFullYear();
  if (currentMonth < 7) {
    // Assuming academic year starts in August (month 7)
    currentYear = currentYear - 1;
  }
  const currentYearString = `${currentYear}-${currentYear + 1}`;

  let totalAllocationsAdded = 0; // Counts successfully added allocations (not duplicates)
  let totalRowsSkippedDueToMissingEntities = 0; // Counts rows from Flask output where subject or faculty could not be found

  try {
    // Validate required inputs
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded or file processing failed by multer.',
      });
      return;
    }
    if (!req.body.deptAbbreviation) {
      res.status(400).json({
        success: false,
        message: 'Department abbreviation is required.',
      });
      return;
    }
    if (!FLASK_SERVER) {
      res.status(500).json({
        success: false,
        message: 'Flask server URL is not configured.',
      });
      return;
    }

    // Prepare form data to send to Flask server
    const formData = new FormData();
    formData.append('facultyMatrix', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('deptAbbreviation', req.body.deptAbbreviation);

    // Clear caches at the beginning of the request to ensure fresh data
    collegeCache.clear();
    departmentCache.clear();
    academicYearCache.clear();
    semesterCache.clear();
    divisionCache.clear();
    subjectCache.clear();
    facultyCache.clear();

    // Send the Excel file to the Flask server for processing
    const processedData = (await fetchWithRetry(FLASK_SERVER, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        Accept: 'application/json',
      },
      body: formData,
    })) as ProcessedData;

    // Ensure college and academic year records exist in the database
    const college = await ensureCollege();
    const academicYear = await ensureAcademicYear(currentYearString);

    // Find the department based on the provided abbreviation and college ID
    const department = await prisma.department.findFirst({
      where: {
        abbreviation: req.body.deptAbbreviation,
        collegeId: COLLEGE_ID,
      },
    });

    if (!department) {
      res.status(400).json({
        success: false,
        message: `Department '${req.body.deptAbbreviation}' not found for College '${COLLEGE_ID}'`,
      });
      return;
    }

    const startTime = Date.now();

    // Iterate through the processed data received from the Flask server
    for (const [collegeName, collegeData] of Object.entries(processedData)) {
      for (const [deptName, deptData] of Object.entries(collegeData)) {
        for (const [semesterNum, semesterData] of Object.entries(deptData)) {
          const parsedSemesterNum = parseInt(semesterNum);
          if (isNaN(parsedSemesterNum)) {
            console.warn(
              `Skipping invalid semester number: ${semesterNum} found in Flask data.`
            );
            totalRowsSkippedDueToMissingEntities++;
            continue;
          }

          // Ensure Semester exists or create it.
          let semester = await prisma.semester.upsert({
            where: {
              departmentId_semesterNumber_academicYearId: {
                departmentId: department.id,
                semesterNumber: parsedSemesterNum,
                academicYearId: academicYear.id,
              },
            },
            create: {
              departmentId: department.id,
              semesterNumber: parsedSemesterNum,
              academicYearId: academicYear.id,
            },
            update: {},
          });
          semesterCache.set(
            `${department.id}_${parsedSemesterNum}_${academicYear.id}`,
            semester
          );

          for (const [divisionName, divisionData] of Object.entries(
            semesterData
          )) {
            // Ensure Division exists or create it.
            let division = await prisma.division.upsert({
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
                studentCount: 0, // Default student count
              },
              update: {},
            });
            divisionCache.set(
              `${department.id}_${divisionName}_${semester.id}`,
              division
            );

            for (const [subjectAbbreviation, subjectData] of Object.entries(
              divisionData
            )) {
              // Fetch Subject by departmentId and abbreviation (from cache or DB)
              let subject = subjectCache.get(
                `${department.id}_${subjectAbbreviation}`
              );
              if (!subject) {
                subject = await prisma.subject.findFirst({
                  where: {
                    departmentId: department.id,
                    abbreviation: subjectAbbreviation,
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
                console.warn(
                  `Skipping subject allocation: Subject with abbreviation '${subjectAbbreviation}' not found for department '${department.abbreviation}'.`
                );
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
                  };
                  allocationBatch.push(lectureAllocation);
                } else {
                  console.warn(
                    `Skipping lecture allocation: Faculty with abbreviation '${facultyAbbr}' not found for department '${department.abbreviation}'.`
                  );
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
                    };
                    allocationBatch.push(labAllocation);
                  } else {
                    console.warn(
                      `Skipping lab allocation for batch '${batch}': Faculty with abbreviation '${facultyAbbr}' not found for department '${department.abbreviation}'.`
                    );
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
      ((endTime - startTime) / 1000).toFixed(2),
      'seconds'
    );

    res.status(200).json({
      message: 'Faculty matrix import summary',
      rowsAffected: totalAllocationsAdded,
    });
  } catch (error: any) {
    console.error('Processing error for faculty matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process faculty matrix',
      error: error.message || 'Unknown error',
    });
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
