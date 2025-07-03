import express, { Router } from 'express';
import {
  getFacultyRadarData,
  getUniqueFaculties,
  getUniqueSubjects,
} from '../../controllers/analytics/faculty/radarChart';

import { getGroupedBarChartData } from '../../controllers/analytics/faculty/groupedBarChart';

import { getFacultyPerformanceData } from '../../controllers/analytics/faculty/lineChart';
import {getSubjectPerformanceData} from "../../controllers/analytics/faculty/subjectWise"

const router: Router = express.Router();

// Common Routes
router.get('/get-faculties', getUniqueFaculties);
router.get("/get-subjects", getUniqueSubjects);

// Radar chart Routes
router.post('/radar-chart', getFacultyRadarData);

// Grouped bar chart Routes
router.post('/grouped-bar-chart', getGroupedBarChartData);

// Line chart for Semester-wise performance trends
router.post("/line-chart", getFacultyPerformanceData);

// subject wise performance trends
router.post("/subject-wise", getSubjectPerformanceData);

export default router;
