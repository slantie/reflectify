import express from 'express';
import {
  getDivisions,
  createDivision,
  getDivisionById,
  updateDivision,
  deleteDivision,
} from '../../controllers/divisionController';

const router = express.Router();

router.get('/', getDivisions);
router.post('/create', createDivision);
router.get('/:id', getDivisionById);
router.put('/:id/update', updateDivision);
router.delete('/:id', deleteDivision);

export default router;
