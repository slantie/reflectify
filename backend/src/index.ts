import express from 'express';
import authRoutes from './routes/auth/authRoutes';
import cleanDatabaseRoutes from './routes/cleanDatabase';

// Upload Excel File Route Imports
import uploadFacultyData from './routes/upload/facultyData';
import uploadStudentData from './routes/upload/studentData';
import uploadSubjectData from './routes/upload/subjectData';

import dashboardRoutes from './routes/dashboard';
import questionRoutes from './routes/feedback/question.routes';
import questionCategoryRoutes from './routes/feedback/questionCategoryRoutes';
import selectionRoutes from './routes/feedback/selectionRoute';
import collegeRoutes from './routes/routes/collegeRoutes';
import departmentRoutes from './routes/routes/departmentRoutes';
import divisionRoutes from './routes/routes/divisionRoutes';
import facultyRoutes from './routes/routes/facultyRoutes';
import feedbackRoutes from './routes/routes/feedbackRoute';
import semesterRoutes from './routes/routes/semesterRoutes';
import studentRoutes from './routes/routes/studentRoutes';
import subjectAllocationRoutes from './routes/routes/subjectAllocationRoutes';
import subjectRoutes from './routes/routes/subjectRoutes';
import uploadRouter from './routes/upload';
import responseRoutes from './routes/feedback/responseRoutes';
import analyticsRoutes from './routes/analytics/analyticsRoutes';

// Faculty Anaytics Route Imports
import facultyAnalyticsRoutes from './routes/analytics/facultyAnalyticsRoutes';

import cors from 'cors';

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_DEV_URL!,
      process.env.FRONTEND_PROD_URL!,
      process.env.FLASK_DEV_SERVER!,
      process.env.FLASK_PROD_SERVER!,
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clean Database
// Only enable in development/staging environments
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/clean-database', cleanDatabaseRoutes);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRouter);
app.use('/api/dashboard', dashboardRoutes);

// Upload Excel File Routes
app.use('/api/upload/faculty-data', uploadFacultyData);
app.use('/api/upload/student-data', uploadStudentData);
app.use('/api/upload/subject-data', uploadSubjectData);

// Academic Routes
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/semester', semesterRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/subject-allocation', subjectAllocationRoutes);
app.use('/api/selection', selectionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/response', responseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Feedback Routes
app.use('/api/feedback', feedbackRoutes);

// Question Bank Routes
app.use('/api/question-categories', questionCategoryRoutes);

// Faculty Analytics Routes
app.use('/api/faculty-analytics', facultyAnalyticsRoutes);

// General Analytics Routes
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Reflectify Backend APIs Running.');
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
