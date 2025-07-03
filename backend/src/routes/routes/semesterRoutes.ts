import express from 'express';
import {
  getSemesters,
  createSemester,
  getSemesterById,
  updateSemester,
  deleteSemester,
} from '../../controllers/semesterController';

const router = express.Router();

// Semester Routes
router.get('/', getSemesters);
router.post('/create', createSemester);
router.get('/:id', getSemesterById);
router.put('/:id/update', updateSemester);
router.delete('/:id', deleteSemester);

export default router;
