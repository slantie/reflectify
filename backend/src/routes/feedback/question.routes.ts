import express from 'express';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByFormId,
  batchUpdateQuestions,
} from '../../controllers/questionController';

const router = express.Router();

// Direct route definitions without wrapper functions
router.post('/forms/:formId/questions', createQuestion);
router.put('/forms/:formId/questions/:questionId', updateQuestion);
router.delete('/forms/:formId/questions/:questionId', deleteQuestion);
router.get('/forms/:formId/questions', getQuestionsByFormId);
router.put('/forms/:formId/batch-update', batchUpdateQuestions);

export default router;
