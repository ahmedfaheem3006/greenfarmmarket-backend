import { Router } from 'express';
import { getJobs, createJob, getMyJobs, deleteJob, updateJob } from '../controllers/job.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getJobs);
router.get('/my', authenticateJWT, getMyJobs);
router.post('/', authenticateJWT, createJob);
router.put('/:id', authenticateJWT, updateJob);
router.delete('/:id', authenticateJWT, deleteJob);

export default router;
