import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /categories - List all question categories
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.questionCategory.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
};

// POST /categories/create - Create a new category
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryName, description } = req.body;

    // Validate input
    if (!categoryName || !description) {
      res
        .status(400)
        .json({ error: 'Category name and description are required' });
      return;
    }

    const newCategory = await prisma.questionCategory.create({
      data: {
        categoryName,
        description,
      },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Error creating category' });
  }
};

// GET /categories/:id - Get category details by ID
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await prisma.questionCategory.findUnique({
      where: { id },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching category details' });
  }
};

// PUT /categories/:id/update - Update category details by ID
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    // Validate input
    if (!categoryName || !description) {
      res
        .status(400)
        .json({ error: 'Category name and description are required' });
      return;
    }

    const updatedCategory = await prisma.questionCategory.update({
      where: { id },
      data: {
        categoryName,
        description,
      },
    });

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: 'Error updating category details' });
  }
};

// DELETE /categories/:id - Delete a category by ID
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.questionCategory.findUnique({
      where: { id },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await prisma.questionCategory.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting category' });
  }
};
