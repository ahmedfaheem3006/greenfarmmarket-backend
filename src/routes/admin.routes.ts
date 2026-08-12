import { Router } from 'express';
import { getAdminStats, getAdminUsers, getAdminContactMessages } from '../controllers/admin.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Secure all admin routes with JWT and ADMIN role check
router.use(authenticateJWT, requireRoles('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/messages', getAdminContactMessages);

export default router;
