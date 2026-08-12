import { Router } from 'express';
import { getProducts, getProductById, createProduct, deleteProduct, getCategories } from '../controllers/product.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/', authenticateJWT, upload.array('images', 5), createProduct);
router.delete('/:id', authenticateJWT, deleteProduct);

export default router;
