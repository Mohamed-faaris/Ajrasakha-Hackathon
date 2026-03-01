import { Router } from 'express';
import * as coverageController from '../controllers/coverage.controller';

const router = Router();

router.get('/', coverageController.getCoverage);

export default router;
