import { Router } from 'express';
import {
  getAdminStats,
  getAuditLogs,
  createAuditLogManual,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminProducts,
  updateProductStatus,
  deleteAdminProduct,
  getAdminJobs,
  deleteAdminJob,
  getAdminNews,
  createAdminNews,
  updateAdminNews,
  deleteAdminNews,
  getAdminMarketUpdates,
  createMarketUpdate,
  updateMarketUpdate,
  deleteMarketUpdate,
  getAdminContactMessages,
} from '../controllers/admin.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Secure all admin routes with JWT and ADMIN role check
router.use(authenticateJWT, requireRoles('ADMIN'));

// Stats & Audit
router.get('/stats', getAdminStats);
router.get('/audit', getAuditLogs);
router.post('/audit', createAuditLogManual);

// Users Management
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

// Products Management
router.get('/products', getAdminProducts);
router.put('/products/:id/status', updateProductStatus);
router.delete('/products/:id', deleteAdminProduct);

// Jobs Management
router.get('/jobs', getAdminJobs);
router.delete('/jobs/:id', deleteAdminJob);

// News Management
router.get('/news', getAdminNews);
router.post('/news', createAdminNews);
router.put('/news/:id', updateAdminNews);
router.delete('/news/:id', deleteAdminNews);

// Market Updates Management
router.get('/market', getAdminMarketUpdates);
router.post('/market', createMarketUpdate);
router.put('/market/:id', updateMarketUpdate);
router.delete('/market/:id', deleteMarketUpdate);

// Messages
router.get('/messages', getAdminContactMessages);

export default router;
