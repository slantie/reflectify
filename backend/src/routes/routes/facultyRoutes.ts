import express from 'express';
import {
  getFaculties,
  createFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
  getFacultyAbbreviations,
  getAllFacultyAbbreviations
} from '../../controllers/facultyController';

const router = express.Router();

// Faculty Routes
router.get('/', getFaculties);
router.post('/create', createFaculty);
router.get('/:id', getFacultyById);
router.put('/:id/update', updateFaculty);
router.delete('/:id', deleteFaculty);
router.get('/abbreviations/all', getAllFacultyAbbreviations);
router.get('/abbreviations/:deptAbbr', getFacultyAbbreviations);

export default router;
