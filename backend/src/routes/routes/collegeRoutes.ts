import express from 'express';
import {
  getColleges,
  createCollege,
  getCollegeById,
  updateCollege,
  deleteCollege,
} from '../../controllers/collegeController';

const router = express.Router();

// College Routes
router.get('/', getColleges);
router.post('/create', createCollege);
router.get('/:id', getCollegeById);
router.put('/:id/update', updateCollege);
router.delete('/:id', deleteCollege);

export default router;
