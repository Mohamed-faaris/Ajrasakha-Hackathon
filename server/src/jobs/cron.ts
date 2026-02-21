import cron from 'node-cron';
import { Price, TopMover, Mandi, Coverage, MandiPrice } from '../models';

export const startScheduler = () => {
  cron.schedule('0 1 * * *', computeTopMovers, {
    timezone: 'Asia/Kolkata'
  });

  cron.schedule('0 2 * * *', computeMandiPrices, {
    timezone: 'Asia/Kolkata'
  });

  cron.schedule('0 * * * *', computeCoverage, {
    timezone: 'Asia/Kolkata'
  });

  console.log('Scheduler started');
};

export const computeTopMovers = async () => {
  console.log('[Cron] Computing top movers...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestPrices = await Price.aggregate([
      { $match: { date: { $gte: today } } },
      { $sort: { date: -1 } },
      { $group: {
        _id: { cropId: '$cropId', mandiId: '$mandiId' },
        cropId: { $first: '$cropId' },
        cropName: { $first: '$cropName' },
        mandiId: { $first: '$mandiId' },
        modalPrice: { $first: '$modalPrice' },
        date: { $first: '$date' }
      }}
    ]);

    const previousPrices = await Price.aggregate([
      { $match: { date: { $gte: yesterday, $lt: today } } },
      { $sort: { date: -1 } },
      { $group: {
        _id: { cropId: '$cropId', mandiId: '$mandiId' },
        modalPrice: { $first: '$modalPrice' }
      }}
    ]);

    const previousMap = new Map(
      previousPrices.map(p => [`${p._id.cropId}:${p._id.mandiId}`, p.modalPrice])
    );

    const movers: Array<{
      cropId: string;
      cropName: string;
      latestPrice: number;
      previousPrice: number;
      changePct: number;
      direction: 'up' | 'down';
    }> = [];

    for (const latest of latestPrices) {
      const key = `${latest.cropId}:${latest.mandiId}`;
      const previousPrice = previousMap.get(key);
      
      if (previousPrice && previousPrice > 0) {
        const changePct = ((latest.modalPrice - previousPrice) / previousPrice) * 100;
        movers.push({
          cropId: latest.cropId,
          cropName: latest.cropName,
          latestPrice: latest.modalPrice,
          previousPrice,
          changePct: Math.round(changePct * 100) / 100,
          direction: changePct >= 0 ? 'up' : 'down'
        });
      }
    }

    const topGainers = movers
      .filter(m => m.direction === 'up')
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 10);

    const topLosers = movers
      .filter(m => m.direction === 'down')
      .sort((a, b) => a.changePct - b.changePct)
      .slice(0, 10);

    await TopMover.deleteMany({});
    await TopMover.insertMany([...topGainers, ...topLosers]);

    console.log(`[Cron] Computed ${topGainers.length} gainers and ${topLosers.length} losers`);
  } catch (error) {
    console.error('[Cron] Error computing top movers:', error);
  }
};

export const computeMandiPrices = async () => {
  console.log('[Cron] Computing mandi prices for map...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestPrices = await Price.aggregate([
      { $match: { date: { $gte: today } } },
      { $sort: { date: -1 } },
      { $group: {
        _id: { cropId: '$cropId', mandiId: '$mandiId' },
        cropId: { $first: '$cropId' },
        cropName: { $first: '$cropName' },
        mandiId: { $first: '$mandiId' },
        mandiName: { $first: '$mandiName' },
        stateName: { $first: '$stateName' },
        districtName: { $first: '$districtName' },
        modalPrice: { $first: '$modalPrice' },
        date: { $first: '$date' }
      }}
    ]);

    const mandis = await Mandi.find({}).lean();
    const mandiMap = new Map(mandis.map(m => [m._id, m]));

    const mandiPrices = latestPrices
      .filter(p => mandiMap.has(p.mandiId))
      .map(p => {
        const mandi = mandiMap.get(p.mandiId)!;
        return {
          mandiId: p.mandiId,
          mandiName: p.mandiName,
          cropId: p.cropId,
          cropName: p.cropName,
          stateName: p.stateName,
          districtName: p.districtName,
          location: mandi.location,
          modalPrice: p.modalPrice,
          date: p.date
        };
      });

    await MandiPrice.deleteMany({});
    await MandiPrice.insertMany(mandiPrices);

    console.log(`[Cron] Computed ${mandiPrices.length} mandi prices`);
  } catch (error) {
    console.error('[Cron] Error computing mandi prices:', error);
  }
};

export const computeCoverage = async () => {
  console.log('[Cron] Computing coverage stats...');
  try {
    const [totalApmcsResult] = await Mandi.aggregate([
      { $count: 'total' }
    ]);

    const totalApmcs = totalApmcsResult?.total || 0;

    const latestPrices = await Price.aggregate([
      { $sort: { date: -1 } },
      { $limit: 1 }
    ]);

    const latestDate = latestPrices[0]?.date || null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const coveredApmcsResult = await Price.distinct('mandiId', {
      date: { $gte: sevenDaysAgo }
    });

    const coveredApmcs = coveredApmcsResult.length;

    const statesCoveredResult = await Price.distinct('stateId', {
      date: { $gte: sevenDaysAgo }
    });

    const statesCovered = statesCoveredResult.length;

    const totalPrices = await Price.countDocuments();

    const coveragePercent = totalApmcs > 0 
      ? Math.round((coveredApmcs / totalApmcs) * 100 * 100) / 100 
      : 0;

    await Coverage.findByIdAndUpdate(
      'current',
      {
        totalApmcs,
        coveredApmcs,
        coveragePercent,
        statesCovered,
        totalPrices,
        latestDate,
        computedAt: new Date()
      },
      { upsert: true }
    );

    console.log(`[Cron] Coverage: ${coveredApmcs}/${totalApmcs} APMCs (${coveragePercent}%), ${statesCovered} states`);
  } catch (error) {
    console.error('[Cron] Error computing coverage:', error);
  }
};
