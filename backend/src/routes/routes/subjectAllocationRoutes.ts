import express from 'express';
import {
  getSubjectAllocations,
  createSubjectAllocation,
  getSubjectAllocationById,
  updateSubjectAllocation,
  deleteSubjectAllocation,
} from '../../controllers/subjectAllocationController';

const router = express.Router();

// Subject Allocation Routes
router.get('/', getSubjectAllocations); // List all subject allocations
router.post('/create', createSubjectAllocation); // Allocate a subject to a faculty and division
router.get('/:id', getSubjectAllocationById); // Get subject allocation details
router.put('/:id/update', updateSubjectAllocation); // Update subject allocation details
router.delete('/:id', deleteSubjectAllocation); // Delete a subject allocation

export default router;
