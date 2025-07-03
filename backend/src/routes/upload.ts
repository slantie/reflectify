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
const semesterCache = new Map();
const divisionCache = new Map();
const subjectCache = new Map();
const facultyCache = new Map();

const DEBUG = true;
const FLASK_SERVER =
  process.env.NODE_ENV === 'development'
    ? process.env.FLASK_DEV_SERVER
    : process.env.FLASK_PROD_SERVER;

const COLLEGE_ID = 'LDRP-ITR';
// const DEPARTMENT_NAME = 'CE';

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

interface AllocationBatchItem {
  departmentId: string;
  facultyId: string;
  subjectId: string;
  divisionId: string;
  semesterId: string;
  lectureType: 'LECTURE' | 'LAB';
  batch: string;
  academicYear: string;
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

router.post(
  '/faculty-matrix',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const batchSize = 500;
    let allocationBatch: AllocationBatchItem[] = [];
    const currentYear = new Date().getFullYear().toString();

    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const formData = new FormData();
      formData.append('facultyMatrix', req.file.buffer, req.file.originalname);
      formData.append('deptAbbreviation', req.body.deptAbbreviation);

      const processedData = (await fetchWithRetry(FLASK_SERVER!, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      })) as ProcessedData;

      const department = await prisma.department.findFirst({
        where: {
          abbreviation: req.body.deptAbbreviation,
          collegeId: COLLEGE_ID,
        },
      });

      if (!department) {
        res
          .status(400)
          .json({ success: false, message: 'CE Department not found' });
        return;
      }

      const start_time = Date.now();

      for (const [collegeName, collegeData] of Object.entries(processedData)) {
        for (const [deptName, deptData] of Object.entries(collegeData)) {
          for (const [semesterNum, semesterData] of Object.entries(deptData)) {
            const parsedSemesterNum = parseInt(semesterNum);

            let semester = await prisma.semester.upsert({
              where: {
                departmentId_semesterNumber: {
                  departmentId: department.id,
                  semesterNumber: parsedSemesterNum,
                },
              },
              create: {
                departmentId: department.id,
                semesterNumber: parsedSemesterNum,
                academicYear: currentYear,
              },
              update: {},
            });

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
                  studentCount: 0,
                },
                update: {},
              });

              for (const [subjectCode, subjectData] of Object.entries(
                divisionData
              )) {
                let subject = await prisma.subject.findFirst({
                  where: {
                    departmentId: department.id,
                    abbreviation: subjectCode,
                  },
                });

                if (subject) {
                  if (subjectData.lectures) {
                    const facultyAbbr = subjectData.lectures.designated_faculty;
                    let faculty = await prisma.faculty.findFirst({
                      where: {
                        departmentId: department.id,
                        abbreviation: facultyAbbr,
                      },
                    });

                    if (faculty) {
                      const lectureAllocation = {
                        departmentId: department.id,
                        facultyId: faculty.id,
                        subjectId: subject.id,
                        divisionId: division.id,
                        semesterId: semester.id,
                        lectureType: 'LECTURE' as const,
                        batch: '-',
                        academicYear: currentYear,
                      };

                      allocationBatch.push(lectureAllocation);
                    }
                  }

                  if (subjectData.labs) {
                    for (const [batch, labData] of Object.entries(
                      subjectData.labs
                    )) {
                      const facultyAbbr = labData.designated_faculty;
                      let faculty = await prisma.faculty.findFirst({
                        where: {
                          departmentId: department.id,
                          abbreviation: facultyAbbr,
                        },
                      });

                      if (faculty) {
                        const labAllocation = {
                          departmentId: department.id,
                          facultyId: faculty.id,
                          subjectId: subject.id,
                          divisionId: division.id,
                          semesterId: semester.id,
                          lectureType: 'LAB' as const,
                          batch: batch,
                          academicYear: currentYear,
                        };
                        allocationBatch.push(labAllocation);
                      }
                    }
                  }

                  if (allocationBatch.length >= batchSize) {
                    const result = await prisma.subjectAllocation.createMany({
                      data: allocationBatch,
                    });
                    allocationBatch = [];
                  }
                }
              }
            }
          }
        }
      }

      if (allocationBatch.length > 0) {
        const result = await prisma.subjectAllocation.createMany({
          data: allocationBatch,
        });
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
      collegeCache.clear();
      departmentCache.clear();
      semesterCache.clear();
      divisionCache.clear();
      subjectCache.clear();
      facultyCache.clear();
    }
  }
);

export default router;
