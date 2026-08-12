import { Router } from 'express';
import { getArticles, getArticleById } from '../controllers/news.controller';

const router = Router();

router.get('/', getArticles);
router.get('/:id', getArticleById);

export default router;
