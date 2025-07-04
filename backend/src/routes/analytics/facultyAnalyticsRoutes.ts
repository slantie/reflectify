// facultyAnalyticsRoutes.ts
import express, { Router } from 'express';
import {
  getFacultyRadarData,
  getUniqueFaculties,
  getUniqueSubjects,
} from '../../controllers/analytics/faculty/radarChart';

import { getGroupedBarChartData } from '../../controllers/analytics/faculty/groupedBarChart';

import { getFacultyPerformanceData } from '../../controllers/analytics/faculty/lineChart';
import { getSubjectPerformanceData } from '../../controllers/analytics/faculty/subjectWise';

import {
  getAllFacultyPerformanceData,
  getFacultyPerformanceYearData,
} from '../../controllers/facultyYearAnalytics.controller';

// *** NEW: Import the asyncHandler utility ***
import asyncHandler from '../../utils/asyncHandler'; // Adjust path as needed

const router: Router = express.Router();

// Common Routes
router.get('/get-faculties', asyncHandler(getUniqueFaculties)); // Apply asyncHandler if these are also async
router.get('/get-subjects', asyncHandler(getUniqueSubjects)); // Apply asyncHandler if these are also async

// Radar chart Routes
router.post('/radar-chart', asyncHandler(getFacultyRadarData));

// Grouped bar chart Routes
router.post('/grouped-bar-chart', asyncHandler(getGroupedBarChartData));

// Line chart for Semester-wise performance trends
router.post('/line-chart', asyncHandler(getFacultyPerformanceData));

// subject wise performance trends
router.post('/subject-wise', asyncHandler(getSubjectPerformanceData));

// All faculty performance for an academic year
router.get(
  '/get-all-faculty-performance/:academicYearId/',
  asyncHandler(getAllFacultyPerformanceData)
);

// Faculty performance for a specific academic year
router.get(
  '/get-faculty-performance-year/:academicYearId/:facultyId',
  asyncHandler(getFacultyPerformanceYearData)
);

export default router;
