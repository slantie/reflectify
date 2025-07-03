import express from 'express';
import {
  generateForms,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
  addQuestionToForm,
  updateFormStatus,
  bulkUpdateFormStatus,
  getFormByAccessToken,
} from '../../controllers/feedbackController';

const router = express.Router();

router.post('/generate', generateForms);
router.get('/forms', getAllForms);
router.get('/forms/:id', getFormById);
router.put('/forms/:id', updateForm);
router.delete('/forms/:id', deleteForm);
router.post('/forms/:id/questions', addQuestionToForm);
router.put('/forms/:id/status', updateFormStatus);
router.put('/forms/status', bulkUpdateFormStatus);
router.get('/forms/access/:token', getFormByAccessToken);

export default router;
