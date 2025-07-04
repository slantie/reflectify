// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

// This type ensures the wrapped function is an async Express RequestHandler
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * A wrapper for async Express route handlers to catch errors and pass them to the next middleware.
 * This avoids repetitive try-catch blocks in every async controller.
 *
 * @param fn The async function (controller) to wrap.
 * @returns An Express RequestHandler.
 */
const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
