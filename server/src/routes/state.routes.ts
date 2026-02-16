import { Router } from 'express';
import * as stateController from '../controllers/state.controller';

const router = Router();

router.get('/', stateController.getAllStates);
router.get('/:id', ...stateController.getStateById);

export default router;
