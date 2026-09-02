import { Router } from 'express';
import { createContactMessage, claimDiscount } from '../controllers/contact.controller';

const router = Router();

router.post('/', createContactMessage);
router.post('/claim-discount', claimDiscount);
router.post('/discount', claimDiscount);

export default router;
