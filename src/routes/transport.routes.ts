import { Router } from 'express';
import {
  calculateCost,
  createTransportRequest,
  getMyTransportRequests,
  getTransportOffers,
  createTransportOffer,
  deleteTransportOffer,
} from '../controllers/transport.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/calculate', calculateCost);
router.post('/requests', authenticateJWT, createTransportRequest);
router.get('/requests/my', authenticateJWT, getMyTransportRequests);
router.get('/offers', getTransportOffers);
router.post('/offers', authenticateJWT, createTransportOffer);
router.delete('/offers/:id', authenticateJWT, deleteTransportOffer);

export default router;
