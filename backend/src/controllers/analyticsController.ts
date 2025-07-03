import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Input validation schemas
const semesterParamsSchema = z.object({
  semesterId: z.string().uuid(),
});

const filterQuerySchema = z.object({
  divisionId: z.string().uuid().optional(),
  batch: z.string().optional(),
});

const subjectQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
});

export const getOverallSemesterRating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId } = semesterParamsSchema.parse(req.params);
    const filters = filterQuerySchema.parse(req.query);

    const whereClause: Prisma.StudentResponseWhereInput = {
      form: {
        subjectAllocation: {
          semesterId,
        },
      },
    };

    if (filters.divisionId) {
      whereClause.form = whereClause.form || {};
      whereClause.form.divisionId = filters.divisionId;
    }

    if (filters.batch) {
      whereClause.student = {
        batch: filters.batch,
      };
    }

    const responses = await prisma.studentResponse.findMany({
      where: whereClause,
      select: {
        value: true,
      },
    });

    if (!responses.length) {
      res
        .status(404)
        .json({ error: 'No responses found for the given semester' });
      return;
    }

    const numericResponses = responses.filter(
      (r) => typeof r.value === 'number'
    );
    const averageRating =
      numericResponses.reduce((acc, r) => acc + (r.value as number), 0) /
      numericResponses.length;

    res.json({
      semesterId,
      averageRating: Number(averageRating.toFixed(2)),
      totalResponses: responses.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: 'Invalid input parameters', details: error.errors });
      return;
    }
    res
      .status(500)
      .json({ error: 'Internal server error while calculating ratings' });
  }
};

export const getSemestersWithResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    const semestersWithResponses = await prisma.semester.findMany({
      where: {
        allocations: {
          some: {
            feedbackForms: {
              some: {
                responses: {
                  some: {}
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        semesterNumber: true,
        academicYear: true
      },
      orderBy: {
        semesterNumber: 'desc'
      }
    });

    res.json(semestersWithResponses);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching semesters with responses' });
  }
};


export const getSubjectWiseLectureLabRating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId } = semesterParamsSchema.parse(req.params);

    const ratings = await prisma.feedbackForm.findMany({
      where: {
        subjectAllocation: {
          semesterId,
        },
      },
      include: {
        subjectAllocation: {
          include: {
            subject: true,
          },
        },
        questions: {
          include: {
            responses: {
              select: {
                value: true,
              },
            },
          },
        },
      },
    });

    if (!ratings.length) {
      res
        .status(404)
        .json({ error: 'No feedback data found for the given semester' });
      return;
    }

    const subjectRatings = ratings.map((form) => {
      const responses = form.questions.flatMap((q) => q.responses);
      const avgRating =
        responses.reduce(
          (acc, r) => acc + (typeof r.value === 'number' ? r.value : 0),
          0
        ) / responses.length;

      return {
        subject: form.subjectAllocation.subject.name,
        lectureType: form.subjectAllocation.lectureType,
        averageRating: Number(avgRating.toFixed(2)),
        responseCount: responses.length,
      };
    });

    res.json(subjectRatings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid semester ID' });
      return;
    }
    res.status(500).json({ error: 'Error fetching subject-wise ratings' });
  }
};

export const getHighImpactFeedbackAreas = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId } = semesterParamsSchema.parse(req.params);
    const LOW_RATING_THRESHOLD = 3;
    const SIGNIFICANT_COUNT = 5;

    const questionsWithLowRatings = await prisma.feedbackQuestion.findMany({
      where: {
        form: {
          subjectAllocation: {
            semesterId,
          },
        },
      },
      include: {
        responses: {
          where: {
            value: {
              lt: LOW_RATING_THRESHOLD,
            },
          },
        },
        category: true,
        faculty: true,
        subject: true,
      },
    });

    const significantLowRatedQuestions = questionsWithLowRatings.filter(
      (question) => question.responses.length > SIGNIFICANT_COUNT
    );

    if (!significantLowRatedQuestions.length) {
      res.status(404).json({ message: 'No significant low-rated areas found' });
      return;
    }

    const impactAreas = significantLowRatedQuestions.map((question) => ({
      question: question.text,
      category: question.category.categoryName,
      faculty: question.faculty.name,
      subject: question.subject.name,
      lowRatingCount: question.responses.length,
      averageRating: Number(
        (
          question.responses.reduce(
            (acc, r) => acc + (typeof r.value === 'number' ? r.value : 0),
            0
          ) / question.responses.length
        ).toFixed(2)
      ),
    }));

    res.json(impactAreas);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid semester ID' });
      return;
    }
    res.status(500).json({ error: 'Error analyzing high impact areas' });
  }
};

export const getSemesterTrendAnalysis = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { subjectId } = subjectQuerySchema.parse(req.query);

    const whereClause: Prisma.FeedbackFormWhereInput = {};
    if (subjectId) {
      whereClause.subjectAllocation = {
        subjectId: String(subjectId),
      };
    }

    const trends = await prisma.feedbackForm.findMany({
      where: whereClause,
      include: {
        subjectAllocation: {
          include: {
            semester: true,
            subject: true,
          },
        },
        questions: {
          include: {
            responses: {
              select: {
                value: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!trends.length) {
      res.status(404).json({ message: 'No trend data available' });
      return;
    }

    const enrichedTrends = trends.map((form) => {
      const responses = form.questions.flatMap((q) => q.responses);
      const avgRating =
        responses.reduce(
          (acc, r) => acc + (typeof r.value === 'number' ? r.value : 0),
          0
        ) / responses.length;

      return {
        semester: form.subjectAllocation.semester.semesterNumber,
        subject: form.subjectAllocation.subject.name,
        averageRating: Number(avgRating.toFixed(2)),
        academicYear: form.subjectAllocation.semester.academicYear,
        responseCount: responses.length,
      };
    });

    res.json(enrichedTrends);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters' });
      return;
    }
    res.status(500).json({ error: 'Error analyzing semester trends' });
  }
};

export const getAnnualPerformanceTrend = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const annualTrends = await prisma.feedbackAnalytics.groupBy({
      by: ['calculatedAt'],
      _avg: {
        averageRating: true,
        completionRate: true,
      },
      orderBy: {
        calculatedAt: 'asc',
      },
    });

    if (!annualTrends.length) {
      res.status(404).json({ message: 'No annual performance data available' });
      return;
    }

    const formattedTrends = annualTrends.map((trend) => ({
      year: new Date(trend.calculatedAt).getFullYear(),
      averageRating: Number(trend._avg.averageRating?.toFixed(2) ?? 0),
      completionRate: Number(trend._avg.completionRate?.toFixed(2) ?? 0),
    }));

    res.json(formattedTrends);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error analyzing annual performance trends' });
  }
};

export const getDivisionBatchComparisons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId } = semesterParamsSchema.parse(req.params);

    const comparisons = await prisma.feedbackForm.findMany({
      where: {
        subjectAllocation: {
          semesterId,
        },
      },
      include: {
        division: true,
        questions: {
          include: {
            responses: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!comparisons.length) {
      res.status(404).json({ message: 'No comparison data available' });
      return;
    }

    const comparisonData = comparisons.reduce((acc: any[], form) => {
      const responses = form.questions.flatMap((q) => q.responses);
      const batchGroups = groupBy(responses, (r) => r.student.batch);

      Object.entries(batchGroups).forEach(([batch, batchResponses]) => {
        const avgRating =
          batchResponses.reduce(
            (sum, r) => sum + (typeof r.value === 'number' ? r.value : 0),
            0
          ) / batchResponses.length;

        acc.push({
          division: form.division.divisionName,
          batch,
          averageRating: Number(avgRating.toFixed(2)),
          responseCount: batchResponses.length,
        });
      });

      return acc;
    }, []);

    res.json(comparisonData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid semester ID' });
      return;
    }
    res.status(500).json({ error: 'Error comparing divisions and batches' });
  }
};

export const getLabLectureComparison = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { semesterId } = semesterParamsSchema.parse(req.params);

    const forms = await prisma.feedbackForm.findMany({
      where: {
        subjectAllocation: {
          semesterId,
        },
      },
      include: {
        subjectAllocation: true,
        questions: {
          include: {
            responses: {
              select: {
                value: true,
              },
            },
          },
        },
      },
    });

    if (!forms.length) {
      res.status(404).json({ message: 'No comparison data available' });
      return;
    }

    const lectureTypeGroups = groupBy(
      forms,
      (f) => f.subjectAllocation.lectureType
    );
    const comparison = Object.entries(lectureTypeGroups).map(
      ([lectureType, forms]) => {
        const allResponses = forms.flatMap((f) =>
          f.questions.flatMap((q) => q.responses)
        );
        const avgRating =
          allResponses.reduce(
            (sum, r) => sum + (typeof r.value === 'number' ? r.value : 0),
            0
          ) / allResponses.length;

        return {
          lectureType,
          averageRating: Number(avgRating.toFixed(2)),
          responseCount: allResponses.length,
          formCount: forms.length,
        };
      }
    );

    res.json(comparison);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid semester ID' });
      return;
    }
    res.status(500).json({ error: 'Error comparing lab and lecture ratings' });
  }
};

// Helper function for grouping
function groupBy<T>(array: T[], key: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = key(item);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}
