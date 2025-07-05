/**
 * @file src/controllers/upload/facultyMatrix.controller.ts
 * @description Controller layer for handling faculty matrix upload requests.
 */

import AppError from '../../utils/appError'; // Import AppError
import { Request, Response } from 'express';
import { SemesterTypeEnum } from '@prisma/client';
import asyncHandler from '../../utils/asyncHandler'; // Import asyncHandler
import { fileUploadSchema } from '../../utils/validators/upload.validation'; // Import file validation schema
import { facultyMatrixUploadService } from '../../services/upload/facultyMatrix.service';
import { uploadFacultyMatrixBodySchema } from '../../utils/validators/upload.validation'; // Import body validation schema

/**
 * @description Handles the upload and processing of the faculty matrix Excel file.
 * This function is designed to be used as an Express route handler AFTER Multer processes the file.
 * @param {Request} req - Express Request object (expects req.file and req.body to be populated)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const uploadFacultyMatrix = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Validate uploaded file using Zod
    const fileValidationResult = fileUploadSchema.safeParse(req);
    if (!fileValidationResult.success) {
      const errorMessage = fileValidationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new AppError(`File upload validation failed: ${errorMessage}`, 400);
    }

    // 2. Validate request body parameters using Zod
    const bodyValidationResult = uploadFacultyMatrixBodySchema.safeParse(
      req.body
    );
    if (!bodyValidationResult.success) {
      const errorMessage = bodyValidationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new AppError(
        `Request body validation failed: ${errorMessage}`,
        400
      );
    }

    // Multer should have processed the file
    if (!req.file) {
      // This is a fallback, as fileValidationResult should catch it.
      throw new AppError(
        'No file uploaded or file processing failed by multer.',
        400
      );
    }

    const { academicYear, semesterRun, deptAbbreviation } =
      bodyValidationResult.data;

    const result = await facultyMatrixUploadService.processFacultyMatrix(
      req.file.buffer,
      academicYear,
      semesterRun as SemesterTypeEnum,
      deptAbbreviation
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      rowsAffected: result.rowsAffected,
      totalRowsSkippedDueToMissingEntities:
        result.totalRowsSkippedDueToMissingEntities,
      skippedRowsDetails: result.skippedRowsDetails,
    });
  }
);
