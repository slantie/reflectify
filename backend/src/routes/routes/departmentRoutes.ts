import express from 'express';
import {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '../../controllers/departmentController';

const router = express.Router();

// Department Routes
router.get('/', getDepartments);
router.post('/create', createDepartment);
router.get('/:id', getDepartmentById);
router.put('/:id/update', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
