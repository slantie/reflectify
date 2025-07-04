// Load environment variables as early as possible
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';

// --- Route Imports ---

// 1. Authentication Routes
import authRoutes from './routes/auth/authRoutes';

// 2. Upload/Data Management Routes
// Assuming 'upload/index.ts' consolidates all specific excel uploads (faculty, student, subject)
import uploadRouter from './routes/upload';

// 3. Core Academic/Entity Management Routes
import academicYearRoutes from './routes/routes/academicYear.route';
import collegeRoutes from './routes/routes/collegeRoutes';
import departmentRoutes from './routes/routes/departmentRoutes';
import divisionRoutes from './routes/routes/divisionRoutes';
import facultyRoutes from './routes/routes/facultyRoutes';
import semesterRoutes from './routes/routes/semesterRoutes';
import studentRoutes from './routes/routes/studentRoutes';
import subjectRoutes from './routes/routes/subjectRoutes';
import subjectAllocationRoutes from './routes/routes/subjectAllocationRoutes';

// 4. Feedback System Routes
import feedbackRoutes from './routes/routes/feedbackRoute'; // Main feedback form creation/management
import questionRoutes from './routes/feedback/question.routes'; // Individual question management
import questionCategoryRoutes from './routes/feedback/questionCategoryRoutes'; // Question categories
import responseRoutes from './routes/feedback/responseRoutes'; // Student response submission/checking
import selectionRoutes from './routes/feedback/selectionRoute'; // Likely related to form selection/pre-requisites

// 5. Analytics & Dashboard Routes
import dashboardRoutes from './routes/dashboard'; // General dashboard data
import analyticsRoutes from './routes/analytics/analyticsRoutes'; // Generic analytics
import facultyAnalyticsRoutes from './routes/analytics/facultyAnalyticsRoutes'; // Faculty-specific analytics

// 6. Admin/Development Utility Routes (Conditional for Production)
import cleanDatabaseRoutes from './routes/cleanDatabase';

// --- Initialize Express App ---
const app = express();

// --- Middleware ---

// CORS Configuration: Allow specific origins, crucial for security in production
app.use(
  cors({
    origin: [
      process.env.FRONTEND_DEV_URL!,
      process.env.FRONTEND_PROD_URL!,
      process.env.FLASK_DEV_SERVER!,
      process.env.FLASK_PROD_SERVER!,
      // Add any other specific origins if needed, e.g., for mobile apps
    ],
    credentials: true, // Allow cookies and authorization headers to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Explicitly allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allowed headers
  })
);

// Body Parsers: For parsing JSON and URL-encoded data from incoming requests
app.use(express.json({ limit: '10mb' })); // Increased limit for potentially large JSON payloads (e.g., large excel data)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Route Mounting ---

// 1. Admin/Development Utility Routes (Conditional)
// Only enable in non-production environments for safety
if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ Development Route: /api/clean-database is enabled.');
  app.use('/api/clean-database', cleanDatabaseRoutes);
}

// 2. Authentication Routes
app.use('/api/auth', authRoutes);

// 3. Upload/Data Management Routes
// All specific excel upload routes (faculty-data, student-data, subject-data)
// should be handled by the 'uploadRouter' internally (e.g., in routes/upload/index.ts)
app.use('/api/upload', uploadRouter);

// 4. Core Academic/Entity Management Routes
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/semester', semesterRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/subject-allocation', subjectAllocationRoutes);

// 5. Feedback System Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/questions', questionRoutes); // For managing individual questions (CRUD)
app.use('/api/question-categories', questionCategoryRoutes);
app.use('/api/response', responseRoutes); // For submitting and checking responses
app.use('/api/selection', selectionRoutes); // For student/form selection process

// 6. Analytics & Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);
// Mount general analytics once
app.use('/api/analytics', analyticsRoutes);
app.use('/api/faculty-analytics', facultyAnalyticsRoutes);

// --- Root Route ---
app.get('/', (req, res) => {
  res.send('Reflectify Backend APIs Running.');
});

// --- Error Handling Middleware ---
// This should be the last middleware mounted.
// It catches any errors thrown by previous middleware or route handlers.
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled API Error:', err.stack); // Log the stack trace for debugging
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'An unexpected error occurred.',
      // In production, avoid sending detailed error stack traces
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack,
      }),
    });
  }
);

// --- Start the Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `CORS Origins: ${process.env.FRONTEND_DEV_URL}, ${process.env.FRONTEND_PROD_URL}, etc.`
  );
});

export default app; // Export app for testing purposes
