import { Router } from 'express';
import * as mandiPriceController from '../controllers/mandiPrice.controller';

const router = Router();

router.get('/', ...mandiPriceController.getMandiPrices);
router.get('/bounds', ...mandiPriceController.getMandiPricesInBounds);
router.get('/mandi/:mandiId', ...mandiPriceController.getMandiPriceByMandiId);

export default router;
