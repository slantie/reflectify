import express, { Request, Response } from 'express';
import {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsBySemester,
  getSubjectAbbreviations,
  getAllSubjectAbbreviations,
} from '../../controllers/subjectController';

const router = express.Router();

// Subject Routes
router.get('/', getSubjects); // List all subjects
router.post('/create', createSubject); // Add a new subject
router.get('/:id', getSubjectById); // Get subject details
router.put('/:id/update', updateSubject); // Update subject details
router.delete('/:id', deleteSubject); // Delete a subject
router.get('/semester/:semesterId', getSubjectsBySemester);
router.get('/abbreviations/all', getAllSubjectAbbreviations);
router.get('/abbreviations/:deptAbbr', getSubjectAbbreviations);

export default router;
