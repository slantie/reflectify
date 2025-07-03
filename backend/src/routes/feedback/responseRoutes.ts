import express from 'express';
import {
  submitResponses,
  checkSubmission,
} from '../../controllers/responseController';

const responseRoutes = express.Router();

// Direct route definition without wrapper function
responseRoutes.post('/submit/:token', submitResponses);
responseRoutes.get('/check-submission/:token', checkSubmission);

export default responseRoutes;
