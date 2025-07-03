import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { sendFormAccessEmail } from '../services/emailService';

const prisma = new PrismaClient();

interface FeedbackQuestion {
  categoryId: string;
  text: string;
  type: 'rating' | 'text';
  isRequired: boolean;
  displayOrder: number;
}

interface SemesterSelection {
  id: string;
  divisions: string[];
}

interface FormGenerationRequest {
  departmentId: string;
  selectedSemesters: SemesterSelection[];
}

async function ensureQuestionCategories() {
  const categories = [
    {
      id: 'lecture-feedback',
      categoryName: 'Lecture Feedback',
      description: 'Feedback for theory lectures',
    },
    {
      id: 'lab-feedback',
      categoryName: 'Laboratory Feedback',
      description: 'Feedback for laboratory sessions',
    },
  ];

  for (const category of categories) {
    await prisma.questionCategory.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }
}

export const generateForms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await ensureQuestionCategories();
    const { departmentId, selectedSemesters }: FormGenerationRequest = req.body;

    const generatedForms = [];

    for (const semester of selectedSemesters) {
      for (const divisionId of semester.divisions) {
        const allocations = await prisma.subjectAllocation.findMany({
          where: {
            AND: [
              { divisionId },
              { semesterId: semester.id },
              { OR: [{ lectureType: 'LECTURE' }, { lectureType: 'LAB' }] },
            ],
          },
          include: {
            faculty: true,
            subject: true,
            division: true,
          },
        });

        if (!allocations.length) continue;

        const form = await prisma.feedbackForm.create({
          data: {
            divisionId,
            subjectAllocationId: allocations[0].id,
            title: generateFormTitle(allocations[0].division),
            status: 'DRAFT',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            accessHash: generateHash(),
            questions: {
              create: generateQuestionsForAllSubjects(allocations),
            },
          },
          include: {
            questions: true,
            division: {
              include: {
                semester: true,
                department: true,
              },
            },
          },
        });

        generatedForms.push(form);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully generated ${generatedForms.length} feedback forms`,
      data: generatedForms,
    });
  } catch (error: any) {
    console.error('Error generating forms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating feedback forms',
    });
  }
};

export const getAllForms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const forms = await prisma.feedbackForm.findMany({
      include: {
        questions: true,
        division: true,
        subjectAllocation: {
          include: {
            faculty: true,
            subject: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: forms,
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ success: false, error: 'Error fetching forms' });
  }
};

export const getFormById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const form = await prisma.feedbackForm.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            faculty: true,
            subject: true,
            category: true,
          },
        },
        division: true,
      },
    });

    if (!form) {
      res.status(404).json({ success: false, error: 'Form not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ success: false, error: 'Error fetching form' });
  }
};

export const updateForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, status, startDate, endDate } = req.body;

    const updatedForm = await prisma.feedbackForm.update({
      where: { id },
      data: {
        title,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        questions: {
          include: {
            faculty: true,
            subject: true,
            category: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedForm,
    });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ success: false, error: 'Error updating form' });
  }
};

export const deleteForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.feedbackForm.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Form deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ success: false, error: 'Error deleting form' });
  }
};

export const addQuestionToForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedForm = await prisma.feedbackForm.update({
      where: { id },
      data: {
        questions: {
          create: {
            text: req.body.text,
            categoryId: req.body.categoryId,
            facultyId: req.body.facultyId,
            subjectId: req.body.subjectId,
            batch: req.body.batch,
            type: req.body.type,
            isRequired: req.body.isRequired,
            displayOrder: req.body.displayOrder,
          },
        },
      },
      include: {
        questions: {
          include: {
            faculty: true,
            subject: true,
            category: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedForm,
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ success: false, error: 'Error adding question' });
  }
};

function generateFormTitle(division: any): string {
  return `Student Feedback Form - ${division.divisionName}`;
}

function generateQuestionsForAllSubjects(allocations: any[]): any[] {
  let questions: any[] = [];
  let displayOrder = 1;

  allocations.forEach((allocation) => {
    const sessionType = allocation.lectureType === 'LECTURE' ? 'Theory' : 'Lab';
    const categoryId =
      allocation.lectureType === 'LECTURE'
        ? 'lecture-feedback'
        : 'lab-feedback';
    const batchValue =
      allocation.lectureType === 'LECTURE' ? 'None' : allocation.batch;

    questions.push({
      categoryId,
      facultyId: allocation.faculty.id,
      subjectId: allocation.subject.id,
      batch: batchValue,
      text: `Rate Prof. ${allocation.faculty.name} in Subject: ${allocation.subject.name} (${sessionType}) - ${batchValue}`,
      type: 'rating',
      isRequired: true,
      displayOrder: displayOrder++,
    });
  });

  return questions;
}

function generateHash(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Update the updateFormStatus function
export const updateFormStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, startDate, endDate } = req.body;

    const updatedForm = await prisma.feedbackForm.update({
      where: { id },
      data: {
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        division: true,
        questions: {
          include: {
            faculty: true,
            subject: true,
          },
        },
      },
    });

    // Send emails when form becomes active
    if (status === 'ACTIVE') {
      await sendFormAccessEmail(id, updatedForm.divisionId);
    }

    res.status(200).json({
      success: true,
      message: `Form status updated to ${status}`,
      data: updatedForm,
    });
  } catch (error: any) {
    console.error('Error updating form status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating form status',
    });
  }
};

export const bulkUpdateFormStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { formIds, status, startDate, endDate } = req.body;

    const updatedForms = await prisma.$transaction(
      formIds.map((id: string) =>
        prisma.feedbackForm.update({
          where: { id },
          data: {
            status,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
          include: {
            division: true,
            questions: {
              include: {
                faculty: true,
                subject: true,
              },
            },
          },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedForms.length} forms to ${status}`,
      data: updatedForms,
    });
  } catch (error: any) {
    console.error('Error bulk updating forms:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error bulk updating forms',
    });
  }
};

export const getFormByAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    const formAccess = await prisma.formAccess.findUnique({
      where: { accessToken: token },
      include: {
        form: {
          include: {
            questions: {
              include: {
                faculty: true,
                subject: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!formAccess) {
      res.status(404).json({ success: false, error: 'Invalid access token' });
      return;
    }

    if (formAccess.isSubmitted) {
      res.status(403).json({ success: false, error: 'Form already submitted' });
      return;
    }

    res.status(200).json({
      success: true,
      data: formAccess.form,
    });
  } catch (error) {
    console.error('Error fetching form by token:', error);
    res.status(500).json({ success: false, error: 'Error fetching form' });
  }
};
