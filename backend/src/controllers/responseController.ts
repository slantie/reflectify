import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const submitResponses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const responses = req.body;
    const formAccess = await prisma.formAccess.findUnique({
      where: { accessToken: token },
      include: {
        form: true,
        student: true,
      },
    });

    if (!formAccess) {
      res.status(404).json({
        success: false,
        message: 'Invalid access token',
      });
      return;
    }

    if (formAccess.isSubmitted) {
      res.status(400).json({
        success: false,
        message: 'Feedback already submitted',
      });
      return;
    }

    const studentResponses = await prisma.$transaction(async (tx) => {
      const createdResponses = await Promise.all(
        Object.entries(responses).map(([questionId, value]) => {
          return tx.studentResponse.create({
            data: {
              studentId: formAccess.studentId,
              formId: formAccess.formId,
              questionId,
              value: JSON.stringify(value),
            },
          });
        })
      );

      await tx.formAccess.update({
        where: { id: formAccess.id },
        data: { isSubmitted: true },
      });

      return createdResponses;
    });

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: studentResponses,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
    });
  }
};

export const checkSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    const formAccess = await prisma.formAccess.findUnique({
      where: { accessToken: token },
      include: {
        form: true,
        student: true,
      },
    });

    if (!formAccess) {
      res.status(404).json({
        success: false,
        message: 'Invalid access token',
      });
      return;
    }

    const studentResponses = await prisma.studentResponse.findFirst({
      where: {
        studentId: formAccess.studentId,
        formId: formAccess.formId,
      },
    });

    res.status(200).json({
      success: true,
      isSubmitted: !!studentResponses,
    });
  } catch (error) {
    console.error('Error checking submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking submission status',
    });
  }
};
