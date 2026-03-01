import { Router } from 'express';
import * as predictionController from '../controllers/prediction.controller';

const router = Router();

// GET /api/predictions/:cropId/:mandiId - Get prediction (cached or new)
router.get('/:cropId/:mandiId', predictionController.getPrediction);

// GET /api/predictions/:cropId/:mandiId/status - Check prediction status
router.get('/:cropId/:mandiId/status', predictionController.checkPredictionStatus);

// POST /api/predictions/:cropId/:mandiId/refresh - Force regenerate
router.post('/:cropId/:mandiId/refresh', predictionController.refreshPrediction);

export default router;
