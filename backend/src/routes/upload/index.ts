import { Router } from 'express';
// Import specific upload controllers and their multer instances
import {
  uploadFacultyMatrix,
  upload as facultyMatrixUploadMiddleware,
} from './facultyMatrix.controller';
import {
  uploadStudentData,
  upload as studentUploadMiddleware,
} from './studentData.controller';
import {
  uploadFacultyData,
  upload as facultyUploadMiddleware,
} from './facultyData.controller';
import {
  uploadSubjectData,
  upload as subjectUploadMiddleware,
} from './subjectData.controller';

// Import the singleton Prisma client (though not directly used in this router,
// it's good practice for consistency if other upload controllers might use it)
// import prisma from '../lib/prisma'; // Ensure this path is correct relative to routes/upload/

const router: Router = Router();

/**
 * @description Route for uploading and processing the faculty matrix Excel file.
 * This applies Multer middleware first, then delegates to the `uploadFacultyMatrix` controller.
 * @route POST /api/upload/faculty-matrix
 * @access Private (Admin) - Authentication middleware should be applied before this route.
 */
router.post(
  '/faculty-matrix',
  facultyMatrixUploadMiddleware.single('file'),
  uploadFacultyMatrix
);

/**
 * @description Route for uploading and processing student data from an Excel file.
 * This applies Multer middleware first, then delegates to the `uploadStudentData` controller.
 * @route POST /api/upload/student-data
 * @access Private (Admin) - Authentication middleware should be applied before this route.
 */
router.post(
  '/student-data',
  studentUploadMiddleware.single('studentData'),
  uploadStudentData
);

/**
 * @description Route for uploading and processing faculty data from an Excel file.
 * This applies Multer middleware first, then delegates to the `uploadFacultyData` controller.
 * @route POST /api/upload/faculty-data
 * @access Private (Admin) - Authentication middleware should be applied before this route.
 */
router.post(
  '/faculty-data',
  facultyUploadMiddleware.single('facultyData'),
  uploadFacultyData
);

/**
 * @description Route for uploading and processing subject data from an Excel file.
 * This applies Multer middleware first, then delegates to the `uploadSubjectData` controller.
 * @route POST /api/upload/subject-data
 * @access Private (Admin) - Authentication middleware should be applied before this route.
 */
router.post(
  '/subject-data',
  subjectUploadMiddleware.single('subjectData'),
  uploadSubjectData
);

export default router;
