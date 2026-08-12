import { Router } from 'express';
import { calculateCost, createTransportRequest, getMyTransportRequests, getTransportOffers } from '../controllers/transport.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/calculate', calculateCost);
router.post('/requests', authenticateJWT, createTransportRequest);
router.get('/requests/my', authenticateJWT, getMyTransportRequests);
router.get('/offers', getTransportOffers);

export default router;
