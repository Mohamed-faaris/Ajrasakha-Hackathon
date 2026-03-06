import { Router } from 'express';
import * as predictionController from '../controllers/prediction.controller';

const router = Router();

// GET /api/consumer-portal/predictions/:cropId/:mandiId - Get prediction (cached or new)
router.get('/:cropId/:mandiId', predictionController.getPrediction);

// GET /api/consumer-portal/predictions/:cropId/:mandiId/status - Check prediction status
router.get('/:cropId/:mandiId/status', predictionController.checkPredictionStatus);

// GET /api/consumer-portal/predictions/:cropId/:mandiId/check - Check if enough data exists
router.get('/:cropId/:mandiId/check', predictionController.checkPredictionData);

// POST /api/consumer-portal/predictions/:cropId/:mandiId/refresh - Force regenerate
router.post('/:cropId/:mandiId/refresh', predictionController.refreshPrediction);

export default router;
