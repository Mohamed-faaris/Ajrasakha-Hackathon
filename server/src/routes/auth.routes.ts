import express from 'express';
import { register, login } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, (req: any, res) => {
  res.json(req.user);
});

export default router;
