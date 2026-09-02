import { Router } from 'express';
import { createDiagnosis, getMyDiagnoses } from '../controllers/diagnosis.controller';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/analyze', optionalAuth, upload.single('image'), createDiagnosis);
router.post('/text', optionalAuth, createDiagnosis);
router.post('/image', optionalAuth, upload.single('image'), createDiagnosis);
router.post('/video', optionalAuth, upload.single('video'), createDiagnosis);
router.get('/my', authenticateJWT, getMyDiagnoses);

export default router;
