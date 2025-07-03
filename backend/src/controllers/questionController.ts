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
        isDeleted: false, // Explicitly set to false on creation
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
  } catch (error: any) {
    console.error('Error creating question:', error); // Added error logging
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating question', // More descriptive error
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
      where: {
        id: questionId,
        isDeleted: false, // Only update if not soft-deleted
      },
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
  } catch (error: any) {
    // Added type for error
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update question', // More descriptive error
    });
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { questionId } = req.params;

    await prisma.$transaction(async (tx) => {
      // 1. Soft delete the FeedbackQuestion record
      await tx.feedbackQuestion.update({
        where: { id: questionId },
        data: { isDeleted: true }, // Mark the question as soft-deleted
      });

      // 2. Find all StudentResponse IDs associated with this question
      // These responses will also be soft-deleted by cascade, but we need their IDs for FeedbackSnapshot
      const studentResponseIds = await tx.studentResponse.findMany({
        where: { questionId: questionId },
        select: { id: true },
      });

      // 3. Update all FeedbackSnapshot entries linked to this question or its responses,
      // setting formDeleted to true (assuming 'formDeleted' can also signify question deletion contextually).
      // Or, you might add a 'questionDeleted' field to FeedbackSnapshot if more granular.
      await tx.feedbackSnapshot.updateMany({
        where: {
          OR: [
            { questionId: questionId }, // Direct link to the question being soft-deleted
            {
              originalStudentResponseId: {
                in: studentResponseIds.map((sr) => sr.id),
              },
            }, // Link via original StudentResponse
          ],
        },
        data: {
          // Assuming formDeleted can be reused or you add a new field like questionDeleted
          formDeleted: true, // Mark as deleted (contextually, the form containing this question is affected)
          // If you added `questionDeleted` to FeedbackSnapshot, use it here:
          // questionDeleted: true,
        },
      });

      // 4. Soft delete related StudentResponses (if not already cascaded by FeedbackQuestion soft delete)
      // This is important if onDelete: Cascade on FeedbackQuestion's responses relation is NOT set to SET NULL or NO ACTION,
      // and you want to explicitly soft-delete them rather than relying on hard cascade.
      await tx.studentResponse.updateMany({
        where: { questionId: questionId },
        data: { isDeleted: true },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Question soft-deleted successfully',
      id: questionId,
    });
  } catch (error: any) {
    // Added type for error
    console.error('Error soft-deleting question:', error); // Updated log message
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting question', // More descriptive error
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
      where: {
        formId,
        isDeleted: false, // Only fetch questions that are not soft-deleted
      },
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
  } catch (error: any) {
    // Added type for error
    console.error('Error fetching questions:', error); // Added error logging
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching questions', // More descriptive error
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
          where: {
            id: question.id,
            isDeleted: false, // Only update if not soft-deleted
          },
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
  } catch (error: any) {
    // Added type for error
    console.error('Batch update error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating questions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
