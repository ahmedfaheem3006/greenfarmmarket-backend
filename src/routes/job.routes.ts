import { Router } from 'express';
import { getJobs, createJob } from '../controllers/job.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getJobs);
router.post('/', authenticateJWT, createJob);

export default router;
