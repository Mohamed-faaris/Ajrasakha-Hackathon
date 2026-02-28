import { Router } from 'express';
import * as priceController from '../controllers/price.controller';

const router = Router();

router.get('/', priceController.getPrices);
router.get('/latest', ...priceController.getLatestPrices);
router.get('/trends', ...priceController.getPriceTrends);
router.get('/mandi/:mandiId/crop/:cropId', ...priceController.getPricesByMandiAndCrop);

export default router;
