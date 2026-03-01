import { Router } from 'express';
import { computeTopMovers, computeMandiPrices, computeCoverage } from '../jobs/cron';

const router = Router();



router.post('/top-movers', async (_req, res) => {
  await computeTopMovers();
  res.json({ success: true, message: 'Top movers computed' });
});

router.post('/mandi-prices', async (_req, res) => {
  await computeMandiPrices();
  res.json({ success: true, message: 'Mandi prices computed' });
});

router.post('/coverage', async (_req, res) => {
  await computeCoverage();
  res.json({ success: true, message: 'Coverage computed' });
});

router.post('/all', async (_req, res) => {
  await Promise.all([
    computeTopMovers(),
    computeMandiPrices(),
    computeCoverage()
  ]);
  res.json({ success: true, message: 'All cache jobs completed' });
});

export default router;
