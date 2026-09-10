import { Router } from 'express';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getMarketUpdates,
  createMarketUpdate,
  updateMarketPrice,
  deleteMarketUpdate,
  syncDailyMarketPrices,
} from '../controllers/news.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// News Articles Routes
router.get('/', getArticles);
router.get('/market', getMarketUpdates);
router.get('/:id', getArticleById);

// Admin-Protected News & Market Routes
router.post('/', authenticateJWT, createArticle);
router.put('/:id', authenticateJWT, updateArticle);
router.delete('/:id', authenticateJWT, deleteArticle);

router.post('/market', authenticateJWT, createMarketUpdate);
router.post('/market/sync', authenticateJWT, syncDailyMarketPrices);
router.put('/market/:id', authenticateJWT, updateMarketPrice);
router.delete('/market/:id', authenticateJWT, deleteMarketUpdate);

export default router;
