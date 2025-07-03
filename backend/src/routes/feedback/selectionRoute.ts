import express from 'express';
import { getAcademicStructure } from '../../controllers/commonController';

const router = express.Router();

router.get('/academic-structure', getAcademicStructure);

export default router;
