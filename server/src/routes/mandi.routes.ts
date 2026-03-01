import { Router } from 'express';
import * as mandiController from '../controllers/mandi.controller';

const router = Router();

router.get('/', mandiController.getAllMandis);
router.get('/search', ...mandiController.searchMandis);
router.get('/bounds', ...mandiController.getMandisInBounds);
router.get('/state/:stateId', ...mandiController.getMandisByState);
router.get('/:id', ...mandiController.getMandiById);

export default router;
