import { Router } from 'express';
import * as cropController from '../controllers/crop.controller';

const router = Router();

router.get('/', cropController.getAllCrops);
router.get('/search', ...cropController.searchCrops);
router.get('/:id', ...cropController.getCropById);

export default router;
