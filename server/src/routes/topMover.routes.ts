import { Router } from 'express';
import * as topMoverController from '../controllers/topMover.controller';

const router = Router();

router.get('/', ...topMoverController.getTopMovers);
router.get('/gainers', ...topMoverController.getTopGainers);
router.get('/losers', ...topMoverController.getTopLosers);

export default router;
