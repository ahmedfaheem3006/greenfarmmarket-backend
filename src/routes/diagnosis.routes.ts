import { Router } from 'express';
import { createDiagnosis, getMyDiagnoses } from '../controllers/diagnosis.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/text', authenticateJWT, createDiagnosis);
router.post('/image', authenticateJWT, upload.single('image'), createDiagnosis);
router.post('/video', authenticateJWT, upload.single('video'), createDiagnosis);
router.get('/my', authenticateJWT, getMyDiagnoses);

export default router;
