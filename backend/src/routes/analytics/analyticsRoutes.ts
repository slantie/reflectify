import express, { Router } from 'express';
import { getSemesterAverageRatings } from '../../controllers/analytics/common/semesterAverage';
import { getSubjectWiseRatings } from '../../controllers/analytics/common/groupedBarChart';
import { getSemesterDivisions } from '../../controllers/analytics/common/semesterController';
import { getTotalResponses } from '../../controllers/analytics/common/getTotalResponses';
const router: Router = express.Router();

// Common Routes
router.get('/getall-semdiv', getSemesterDivisions);

// Semester bar chart
router.get('/semester-barchart', getSemesterAverageRatings);

// Grouped bar chart for subject wise lecture and labs rating
router.get('/grouped-barchart', getSubjectWiseRatings);
router.get("/total-responses", getTotalResponses);

export default router;
