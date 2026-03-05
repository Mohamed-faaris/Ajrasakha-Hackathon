import { Router } from 'express';
import * as analyticsPredictionController from '../controllers/analyticsPrediction.controller';

const router = Router();

router.get('/predictions', analyticsPredictionController.getAnalyticsPredictions);

export default router;
