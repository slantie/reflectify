import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const submitResponses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const responses = req.body; // responses is an object like { questionId1: value1, questionId2: value2 }

    // 1. Enrich Initial formAccess Fetch:
    // Include all necessary related data to minimize subsequent database queries.
    const formAccess = await prisma.formAccess.findUnique({
      where: { accessToken: token },
      include: {
        form: {
          include: {
            subjectAllocation: {
              include: {
                faculty: true, // Include faculty details for the allocation
                subject: true, // Include subject details for the allocation
              },
            },
          },
        },
        student: {
          include: {
            academicYear: true, // Include academic year details for the student
            semester: true, // Include semester details for the student
            division: true, // Include division details for the student
          },
        },
      },
    });

    if (!formAccess) {
      res.status(404).json({
        success: false,
        message: 'Invalid access token',
      });
      return;
    }

    // Check if the form itself is soft-deleted before proceeding
    if (formAccess.form?.isDeleted) {
      res
        .status(404)
        .json({ success: false, message: 'Form not found or is deleted.' });
      return;
    }

    if (formAccess.isSubmitted) {
      res.status(400).json({
        success: false,
        message: 'Feedback already submitted',
      });
      return;
    }

    // Ensure all required related data is available for snapshot creation
    if (
      !formAccess.student ||
      !formAccess.student.academicYear ||
      !formAccess.student.semester ||
      !formAccess.student.division ||
      !formAccess.form ||
      !formAccess.form.subjectAllocation ||
      !formAccess.form.subjectAllocation.faculty ||
      !formAccess.form.subjectAllocation.subject
    ) {
      console.error(
        'Missing essential related data for feedback snapshot:',
        formAccess
      );
      res.status(500).json({
        success: false,
        message:
          'Internal server error: Missing essential form or student data.',
      });
      return;
    }

    // 2. Batch Fetch Questions:
    // Get all unique question IDs from the incoming responses.
    const questionIds = Object.keys(responses);

    // Fetch all relevant FeedbackQuestion records and their relations in one go.
    // Ensure only non-deleted questions are considered for submission.
    const questionsWithDetails = await prisma.feedbackQuestion.findMany({
      where: {
        id: {
          in: questionIds,
        },
        isDeleted: false, // Only consider non-soft-deleted questions
      },
      include: {
        category: true, // Include question category
        faculty: true, // Include faculty associated with the question
        subject: true, // Include subject associated with the question
      },
    });

    // Create a map for quick lookup of question details by ID.
    const questionsMap = new Map(questionsWithDetails.map((q) => [q.id, q]));

    // Use a Prisma transaction to ensure atomicity for all operations.
    const studentResponses = await prisma.$transaction(async (tx) => {
      const createdResponses: any[] = [];

      // Iterate over each question/response pair from the request body.
      for (const [questionId, value] of Object.entries(responses)) {
        const question = questionsMap.get(questionId);

        // If a question is not found (e.g., invalid questionId in request) or is soft-deleted, skip it.
        if (!question) {
          console.warn(
            `Question with ID ${questionId} not found or is deleted. Skipping response and snapshot creation for this question.`
          );
          continue; // Skip to the next question
        }

        // Create the original StudentResponse record.
        const studentResponse = await tx.studentResponse.create({
          data: {
            studentId: formAccess.studentId,
            formId: formAccess.formId,
            questionId: question.id, // Use question.id for consistency
            value: JSON.stringify(value), // Store response value as JSON string
            isDeleted: false, // Explicitly set to false for new responses
          },
        });

        // Create the denormalized FeedbackSnapshot record.
        await tx.feedbackSnapshot.create({
          data: {
            originalStudentResponseId: studentResponse.id, // Link to the original response
            // Student Information
            studentId: formAccess.student.id,
            studentEnrollmentNumber: formAccess.student.enrollmentNumber,
            studentName: formAccess.student.name,
            studentEmail: formAccess.student.email,
            // Form Information
            formId: formAccess.form.id,
            formName: formAccess.form.title,
            // Question Information
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            questionCategoryText: question.category.categoryName,
            // Faculty Information (from FeedbackQuestion's relation)
            facultyId: question.faculty.id,
            facultyName: question.faculty.name,
            facultyEmail: question.faculty.email,
            // Subject Information (from FeedbackQuestion's relation)
            subjectId: question.subject.id,
            subjectName: question.subject.name,
            subjectCode: question.subject.subjectCode,
            // Academic Context (from Student's relations)
            academicYearId: formAccess.student.academicYear.id,
            academicYearString: formAccess.student.academicYear.yearString,
            semesterNumber: formAccess.student.semester.semesterNumber,
            divisionName: formAccess.student.division.divisionName,
            batch: question.batch, // Using batch from FeedbackQuestion
            // Response Data
            responseValue: JSON.stringify(value), // Store the actual response value
            submittedAt: studentResponse.submittedAt, // Use the timestamp from the created StudentResponse
            formDeleted: formAccess.form.isDeleted, // Reflect form's soft-delete status
            // If you added `questionDeleted` to FeedbackSnapshot, you'd add it here:
            // questionDeleted: question.isDeleted,
          },
        });

        createdResponses.push(studentResponse);
      }

      // Update the formAccess status to submitted.
      await tx.formAccess.update({
        where: { id: formAccess.id },
        data: { isSubmitted: true },
      });

      return createdResponses;
    });

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: studentResponses, // Return the newly created student responses
    });
  } catch (error: any) {
    // Added type for error
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message || 'Unknown error',
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

    // Check if the form itself is soft-deleted
    if (formAccess.form?.isDeleted) {
      res
        .status(404)
        .json({ success: false, message: 'Form not found or is deleted' });
      return;
    }

    // Check if the formAccess record itself indicates submission
    // This is more reliable than checking for existing student responses,
    // as formAccess.isSubmitted is the definitive flag.
    if (formAccess.isSubmitted) {
      res.status(200).json({
        success: true,
        isSubmitted: true,
      });
      return;
    }

    // Fallback check for student responses (though formAccess.isSubmitted should be primary)
    // Ensure to only count non-soft-deleted responses
    const studentResponsesCount = await prisma.studentResponse.count({
      where: {
        studentId: formAccess.studentId,
        formId: formAccess.formId,
        isDeleted: false, // Only count non-soft-deleted responses
      },
    });

    res.status(200).json({
      success: true,
      isSubmitted: studentResponsesCount > 0,
    });
  } catch (error: any) {
    // Added type for error
    console.error('Error checking submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking submission status',
      error: error.message || 'Unknown error',
    });
  }
};
