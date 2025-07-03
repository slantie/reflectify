import express from 'express';
import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../../controllers/studentController';

const router = express.Router();

// Student Routes
router.get('/getAllStudents', getStudents);
router.post('/create', createStudent);
router.get('/:id', getStudentById);
router.put('/:id/update', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
