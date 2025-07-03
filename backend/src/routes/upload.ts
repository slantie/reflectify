import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';

const router: Router = express.Router();
const prisma: PrismaClient = new PrismaClient();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const collegeCache = new Map();
const departmentCache = new Map();
const academicYearCache = new Map(); // NEW: Cache for AcademicYear
const semesterCache = new Map();
const divisionCache = new Map();
const subjectCache = new Map(); // Not heavily used for find, but can stay
const facultyCache = new Map();

const DEBUG = true;
const FLASK_SERVER =
  process.env.NODE_ENV === 'development'
    ? process.env.FLASK_DEV_SERVER
    : process.env.FLASK_PROD_SERVER;

const COLLEGE_ID = 'LDRP-ITR';

interface ApiError extends Error {
  status?: number;
  type?: string;
}

interface FacultyAssignment {
  designated_faculty: string;
}

interface SubjectAllocation {
  lectures?: {
    designated_faculty: string;
  };
  labs?: {
    [batch: string]: FacultyAssignment;
  };
}

interface DivisionData {
  [subject: string]: SubjectAllocation;
}

interface SemesterData {
  [division: string]: DivisionData;
}

interface DepartmentData {
  [semester: string]: SemesterData;
}

interface CollegeData {
  [department: string]: DepartmentData;
}

interface ProcessedData {
  [college: string]: CollegeData;
}

// UPDATED: AllocationBatchItem now uses academicYearId
interface AllocationBatchItem {
  departmentId: string;
  facultyId: string;
  subjectId: string;
  divisionId: string;
  semesterId: string;
  lectureType: 'LECTURE' | 'LAB';
  batch: string;
  academicYearId: string; // CHANGED: from academicYear to academicYearId
}

const fetchWithRetry = async (
  url: string,
  options: any,
  maxRetries = 3
): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options); // ✅ use passed `url`

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Flask server error: ${text}`);
      }

      return JSON.parse(text); // Parsed JSON
    } catch (error: unknown) {
      const apiError = error as ApiError;

      if (i === maxRetries - 1) throw apiError;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
};

// NEW: Function to ensure AcademicYear exists and is cached
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

router.post(
  '/faculty-matrix',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const batchSize = 500;
    let allocationBatch: AllocationBatchItem[] = [];
    // Using current calendar year for academic year, as per previous discussion
    const currentYear = new Date().getFullYear();
    const currentYearString = `${currentYear - 1}-${currentYear}`;

    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const formData = new FormData();
      formData.append('facultyMatrix', req.file.buffer, req.file.originalname);
      formData.append('deptAbbreviation', req.body.deptAbbreviation);

      // Clear caches at the beginning of the request
      collegeCache.clear();
      departmentCache.clear();
      academicYearCache.clear(); // NEW: Clear academic year cache
      semesterCache.clear();
      divisionCache.clear();
      subjectCache.clear();
      facultyCache.clear();

      const processedData = (await fetchWithRetry(FLASK_SERVER!, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      })) as ProcessedData;

      // Ensure college exists
      const college = await ensureCollege();

      // Ensure the academic year exists and get its ID
      const academicYear = await ensureAcademicYear(currentYearString);

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

      const start_time = Date.now();

      for (const [collegeName, collegeData] of Object.entries(processedData)) {
        for (const [deptName, deptData] of Object.entries(collegeData)) {
          for (const [semesterNum, semesterData] of Object.entries(deptData)) {
            const parsedSemesterNum = parseInt(semesterNum);

            // UPDATED: Semester upsert to include academicYearId in where clause
            let semester = await prisma.semester.upsert({
              where: {
                departmentId_semesterNumber_academicYearId: {
                  // Match new unique constraint
                  departmentId: department.id,
                  semesterNumber: parsedSemesterNum,
                  academicYearId: academicYear.id, // Use the ID of the current academic year
                },
              },
              create: {
                departmentId: department.id,
                semesterNumber: parsedSemesterNum,
                academicYearId: academicYear.id, // Use the ID of the current academic year
              },
              update: {}, // No specific update needed if found by unique constraint
            });
            // Cache semester if needed, though findFirst/upsert generally handle this
            semesterCache.set(
              `${department.id}_${parsedSemesterNum}_${academicYear.id}`,
              semester
            );

            for (const [divisionName, divisionData] of Object.entries(
              semesterData
            )) {
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
                  studentCount: 0, // Assuming 0 as default if not provided
                },
                update: {},
              });
              divisionCache.set(
                `${department.id}_${divisionName}_${semester.id}`,
                division
              );

              for (const [subjectAbbreviation, subjectData] of Object.entries(
                // Changed subjectCode to subjectAbbreviation for clarity
                divisionData
              )) {
                // Fetch subject by departmentId and abbreviation
                let subject = subjectCache.get(
                  `${department.id}_${subjectAbbreviation}`
                );
                if (!subject) {
                  subject = await prisma.subject.findFirst({
                    where: {
                      departmentId: department.id,
                      abbreviation: subjectAbbreviation, // Flask output uses abbreviation here
                    },
                  });
                  if (subject) {
                    subjectCache.set(
                      `${department.id}_${subjectAbbreviation}`,
                      subject
                    );
                  }
                }

                if (subject) {
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
                        batch: '-',
                        academicYearId: academicYear.id, // CHANGED: Use academicYear.id
                      };

                      allocationBatch.push(lectureAllocation);
                    } else {
                      console.warn(
                        `Skipping lecture allocation: Faculty with abbreviation '${facultyAbbr}' not found for department '${department.abbreviation}'.`
                      );
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
                          academicYearId: academicYear.id, // CHANGED: Use academicYear.id
                        };
                        allocationBatch.push(labAllocation);
                      } else {
                        console.warn(
                          `Skipping lab allocation for batch '${batch}': Faculty with abbreviation '${facultyAbbr}' not found for department '${department.abbreviation}'.`
                        );
                      }
                    }
                  }

                  // Check batch size and createMany
                  if (allocationBatch.length >= batchSize) {
                    // Using `skipDuplicates: true` assumes your SubjectAllocation model has the correct
                    // @@unique constraint including academicYearId to prevent true duplicates.
                    // If you want to *update* existing allocations rather than skip, you'd need findMany/deleteMany/createMany
                    // or a more complex upsert logic here. For now, createMany with skipDuplicates is typical for bulk inserts.
                    const result = await prisma.subjectAllocation.createMany({
                      data: allocationBatch,
                      skipDuplicates: true, // Important: Assumes a unique constraint to prevent re-inserting same allocation
                    });
                    if (DEBUG)
                      console.log(
                        `Batch created: ${result.count} allocations.`
                      );
                    allocationBatch = []; // Reset batch
                  }
                } else {
                  console.warn(
                    `Skipping subject allocation: Subject with abbreviation '${subjectAbbreviation}' not found for department '${department.abbreviation}'.`
                  );
                }
              }
            }
          }
        }
      }

      // Insert any remaining allocations in the batch
      if (allocationBatch.length > 0) {
        const result = await prisma.subjectAllocation.createMany({
          data: allocationBatch,
          skipDuplicates: true, // Apply to the final batch too
        });
        if (DEBUG)
          console.log(`Final batch created: ${result.count} allocations.`);
      }

      const end_time = Date.now();
      console.log(
        '🕒 Faculty Matrix processing completed in',
        ((end_time - start_time) / 1000).toFixed(2),
        'seconds'
      );

      res.status(200).json({
        success: true,
        message: 'Faculty matrix processed successfully',
        details: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process faculty matrix',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      // Clear all caches
      collegeCache.clear();
      departmentCache.clear();
      academicYearCache.clear(); // NEW: Clear academic year cache
      semesterCache.clear();
      divisionCache.clear();
      subjectCache.clear();
      facultyCache.clear();
    }
  }
);

export default router;
