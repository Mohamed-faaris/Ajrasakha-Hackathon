import { Router } from 'express';
import * as stateController from '../controllers/state.controller';

const router = Router();

router.get('/', stateController.getStates);
router.get('/:code', stateController.getStateByCode);

export default router;
