import express from 'express';
import {
  getFacultyRadarData,
  getUniqueFaculties,
} from '../../../controllers/analytics/faculty/radarChart';

const router = express.Router();

router.post('/radar-chart', getFacultyRadarData);
router.get('/radar-chart-faculties', getUniqueFaculties);

export default router;
