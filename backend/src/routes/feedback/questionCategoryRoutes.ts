import { Router } from 'express';
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../../controllers/questionCategoryController';

const router = Router();

// Route to list all categories
router.get('/', getCategories);

// Route to create a new category
router.post('/create', createCategory);

// Route to get category details by ID
router.get('/:id', getCategoryById);

// Route to update category details by ID
router.put('/:id/update', updateCategory);

// Route to delete a category by ID
router.delete('/:id', deleteCategory);

export default router;
