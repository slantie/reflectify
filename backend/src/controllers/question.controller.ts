import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const createQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { formId } = req.params;
    const {
      categoryId,
      facultyId,
      subjectId,
      batch,
      text,
      type,
      isRequired,
      displayOrder,
    } = req.body;

    const question = await prisma.feedbackQuestion.create({
      data: {
        formId,
        categoryId,
        facultyId,
        subjectId,
        batch,
        text,
        type,
        isRequired,
        displayOrder,
      },
      include: {
        faculty: true,
        subject: true,
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creating question',
    });
  }
};

export const updateQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { questionId } = req.params;
    const updateData = req.body;

    const question = await prisma.feedbackQuestion.update({
      where: { id: questionId },
      data: {
        text: updateData.text,
        type: updateData.type,
        isRequired: updateData.isRequired,
        categoryId: updateData.categoryId,
        facultyId: updateData.facultyId,
        subjectId: updateData.subjectId,
        batch: updateData.batch,
        displayOrder: updateData.displayOrder,
      },
      include: {
        faculty: true,
        subject: true,
        category: true,
      },
    });

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question',
    });
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { questionId } = req.params;

    await prisma.feedbackQuestion.delete({
      where: { id: questionId },
    });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      id: questionId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting question',
    });
  }
};

export const getQuestionsByFormId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { formId } = req.params;

    const questions = await prisma.feedbackQuestion.findMany({
      where: { formId },
      include: {
        faculty: true,
        subject: true,
        category: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching questions',
    });
  }
};

export const batchUpdateQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const questions = req.body;

    const updatedQuestions = await prisma.$transaction(
      questions.map((question: any) => {
        return prisma.feedbackQuestion.update({
          where: { id: question.id },
          data: {
            categoryId: question.categoryId,
            facultyId: question.facultyId,
            subjectId: question.subjectId,
            batch: question.batch,
            text: question.text,
            type: question.type,
            isRequired: question.isRequired,
            displayOrder: question.displayOrder,
          },
          include: {
            faculty: true,
            subject: true,
            category: true,
          },
        });
      })
    );

    res.status(200).json({
      success: true,
      data: updatedQuestions,
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating questions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
