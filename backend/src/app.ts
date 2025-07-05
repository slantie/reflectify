/**
 * @file src/app.ts
 * @description Configures and sets up the Express application.
 * Includes global middlewares, routes, and error handling.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan'; // For logging HTTP requests
import AppError from './utils/appError';
import globalErrorHandler from './middlewares/error.middleware';
import apiV1Router from './api/v1/routes'; // Main API router for v1

const app: Application = express();

// 1. Security Middlewares
app.use(helmet()); // Sets various HTTP headers for security

// 2. CORS - Cross-Origin Resource Sharing
// Configure CORS based on your frontend's origin in production
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? 'https://reflectify.live' : '*', // Adjust for production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// 3. Body Parsers
app.use(express.json({ limit: '10kb' })); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parses URL-encoded request bodies

// 4. Request Logger (Development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logs HTTP requests to console
}

// 5. API Routes
app.use('/api/v1', apiV1Router); // Mount the main API v1 router

// 6. Handle undefined routes (404 Not Found)
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 7. Global Error Handling Middleware (MUST be the last middleware)
app.use(globalErrorHandler);

export default app;
