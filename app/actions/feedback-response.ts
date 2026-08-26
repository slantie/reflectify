"use server"

import { revalidatePath, updateTag } from "next/cache"
import { z } from "zod"

import { Prisma } from "@/generated/neon"
import { prisma } from "@/lib/db"

export type FeedbackResponseState = { error?: string; success?: string }

const tokenSchema = z.string().trim().min(16).max(256)

function isGeneralQuestion(questionBatch: string) {
  return !questionBatch || questionBatch === "None" || questionBatch === "-"
}

function readSelectedBatches(formData: FormData) {
  const value = formData.get("selectedBatches")
  if (typeof value !== "string") return []
  try {
    const parsed = z
      .array(z.string().trim().min(1).max(64))
      .max(12)
      .safeParse(JSON.parse(value))
    return parsed.success ? [...new Set(parsed.data)] : null
  } catch {
    return null
  }
}

export async function submitFeedbackResponse(
  _previousState: FeedbackResponseState,
  formData: FormData
): Promise<FeedbackResponseState> {
  const token = tokenSchema.safeParse(formData.get("accessToken"))
  if (!token.success) return { error: "This feedback link is invalid." }
  const selectedBatches = readSelectedBatches(formData)
  if (!selectedBatches) return { error: "Please choose valid batches." }

  const access = await prisma.formAccess.findFirst({
    where: { accessToken: token.data, isDeleted: false },
    select: {
      id: true,
      isSubmitted: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          enrollmentNumber: true,
          batch: true,
        },
      },
      overrideStudent: {
        select: {
          id: true,
          name: true,
          email: true,
          enrollmentNumber: true,
          batch: true,
        },
      },
      form: {
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
          isDeleted: true,
          division: {
            select: {
              id: true,
              divisionName: true,
              department: {
                select: { id: true, name: true, abbreviation: true },
              },
              semester: {
                select: {
                  id: true,
                  semesterNumber: true,
                  academicYear: { select: { id: true, yearString: true } },
                },
              },
            },
          },
          questions: {
            where: { isDeleted: false },
            select: {
              id: true,
              type: true,
              batch: true,
              text: true,
              isRequired: true,
              category: { select: { id: true, categoryName: true } },
              faculty: {
                select: {
                  id: true,
                  name: true,
                  abbreviation: true,
                  email: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  abbreviation: true,
                  subjectCode: true,
                },
              },
            },
          },
        },
      },
    },
  })
  if (!access || access.form.isDeleted) {
    return { error: "This feedback link is no longer available." }
  }
  if (access.isSubmitted)
    return { error: "This feedback has already been submitted." }

  const now = new Date()
  if (
    access.form.status !== "ACTIVE" ||
    now < access.form.startDate ||
    now > access.form.endDate
  ) {
    return { error: "This feedback window is not currently open." }
  }

  const availableBatches = new Set(
    access.form.questions
      .map((question) => question.batch)
      .filter((batch) => !isGeneralQuestion(batch))
  )
  if (availableBatches.size > 0 && selectedBatches.length === 0) {
    return { error: "Choose at least one batch before submitting feedback." }
  }
  if (selectedBatches.some((batch) => !availableBatches.has(batch))) {
    return {
      error: "One or more selected batches are not available on this form.",
    }
  }
  const questions = access.form.questions.filter(
    (question) =>
      isGeneralQuestion(question.batch) ||
      selectedBatches.includes(question.batch)
  )
  const answers: {
    questionId: string
    responseValue: string
    numericRating: number | null
  }[] = []

  for (const question of questions) {
    const value = String(formData.get(`answer-${question.id}`) ?? "").trim()
    if (!value) {
      if (question.isRequired) {
        return {
          error: "Please answer every required question before submitting.",
        }
      }
      continue
    }

    if (question.type.toLowerCase() === "rating") {
      const rating = z.coerce.number().int().min(1).max(10).safeParse(value)
      if (!rating.success) return { error: "Ratings must be between 1 and 10." }
      answers.push({
        questionId: question.id,
        responseValue: String(rating.data),
        numericRating: rating.data,
      })
      continue
    }
    answers.push({
      questionId: question.id,
      responseValue: value,
      numericRating: null,
    })
  }

  if (answers.length === 0)
    return { error: "Add at least one response before submitting." }

  try {
    await prisma.$transaction(async (tx) => {
      const marked = await tx.formAccess.updateMany({
        where: { id: access.id, isDeleted: false, isSubmitted: false },
        data: { isSubmitted: true },
      })
      if (marked.count !== 1)
        throw new Error("This feedback has already been submitted.")

      const submission = await tx.feedbackSubmission.create({
        data: { formAccessId: access.id },
      })
      const createdAnswers = await tx.feedbackAnswer.createManyAndReturn({
        data: answers.map((answer) => ({
          submissionId: submission.id,
          questionId: answer.questionId,
          responseValue: answer.responseValue ?? Prisma.JsonNull,
          numericRating: answer.numericRating,
        })),
        select: {
          id: true,
          questionId: true,
          responseValue: true,
          numericRating: true,
        },
      })
      const questionsById = new Map(
        access.form.questions.map((question) => [question.id, question])
      )
      const recipient = access.overrideStudent ?? access.student
      const division = access.form.division
      const semester = division.semester
      const academicYear = semester.academicYear

      await tx.feedbackSnapshot.createMany({
        data: createdAnswers.flatMap((answer) => {
          const question = questionsById.get(answer.questionId)
          if (!question || !recipient) return []
          return [
            {
              answerId: answer.id,
              academicYearId: academicYear.id,
              academicYearString: academicYear.yearString,
              departmentId: division.department.id,
              departmentName: division.department.name,
              departmentAbbreviation: division.department.abbreviation,
              semesterId: semester.id,
              semesterNumber: semester.semesterNumber,
              divisionId: division.id,
              divisionName: division.divisionName,
              subjectId: question.subject.id,
              subjectName: question.subject.name,
              subjectAbbreviation: question.subject.abbreviation,
              subjectCode: question.subject.subjectCode,
              facultyId: question.faculty.id,
              facultyName: question.faculty.name,
              facultyAbbreviation:
                question.faculty.abbreviation ?? question.faculty.name,
              facultyEmail: question.faculty.email,
              studentId: access.student?.id ?? null,
              studentEnrollmentNumber: recipient.enrollmentNumber ?? "Unknown",
              studentName: recipient.name,
              studentEmail: recipient.email,
              overrideStudentId: access.overrideStudent?.id ?? null,
              isOverrideStudent: Boolean(access.overrideStudent),
              formId: access.form.id,
              formName: access.form.title,
              formStatus: access.form.status,
              questionId: question.id,
              questionText: question.text,
              questionType: question.type,
              questionCategoryId: question.category.id,
              questionCategoryName: question.category.categoryName,
              questionBatch: question.batch,
              responseValue: answer.responseValue ?? Prisma.JsonNull,
              numericRating: answer.numericRating,
              batch: recipient.batch ?? "None",
              submittedAt: submission.submittedAt,
            },
          ]
        }),
      })
    })
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Your feedback could not be submitted. Please try again.",
    }
  }

  updateTag("analytics")
  revalidatePath("/feedback/[accessToken]", "page")
  revalidatePath("/analytics")
  return { success: "Thank you. Your feedback has been submitted." }
}
