// src/controllers/upload/studentData.controller.ts

import { Request, Response } from 'express';
import { studentDataUploadService } from '../../services/upload/studentData.service';
import asyncHandler from '../../utils/asyncHandler';
import AppError from '../../utils/appError';
import { fileUploadSchema } from '../../utils/validators/upload.validation'; // Import file validation schema

/**
 * @description Handles the upload and processing of student data from an Excel file.
 * This function is designed to be used as an Express route handler AFTER Multer processes the file.
 * @param {Request} req - Express Request object (expects req.file to be populated by Multer)
 * @param {Response} res - Express Response object
 * @access Private (Admin)
 */
export const uploadStudentData = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate the uploaded file using Zod
    const validationResult = fileUploadSchema.safeParse(req);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new AppError(`File upload validation failed: ${errorMessage}`, 400);
    }

    // Multer middleware should have already processed the file and populated req.file
    if (!req.file) {
      // This check is technically redundant if fileUploadSchema.safeParse(req) passes,
      // but kept as a fallback/clarity.
      throw new AppError(
        'No file uploaded or file processing failed by multer.',
        400
      );
    }

    const result = await studentDataUploadService.processStudentData(
      req.file.buffer
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      rowsAffected: result.rowsAffected, // NEW: Added rowsAffected for consistency
    });
  }
);
