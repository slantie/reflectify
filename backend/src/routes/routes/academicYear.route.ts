import { Router } from 'express';
import {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
} from '../../controllers/academicYear.controller';

const router: Router = Router();

// Routes for AcademicYear management
router.post('/', createAcademicYear);
router.get('/', getAllAcademicYears);
router.get('/:id', getAcademicYearById);
router.put('/:id', updateAcademicYear);
router.delete('/:id', deleteAcademicYear);

export default router;
