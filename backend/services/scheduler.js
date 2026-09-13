const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const { syncScheduleStatus } = require('../utils/scheduleLifecycle');
const { getISTNow } = require('../utils/istTime');

cron.schedule('* * * * *', async () => {
  const ist = getISTNow();
  console.log(`[SCHEDULER] Sync at IST ${ist.date} ${ist.time}`);

  try {
    const activeStates = await Schedule.find({
      status: { $in: ['approved', 'upcoming', 'active'] },
    });

    for (const schedule of activeStates) {
      const before = schedule.status;
      const updated = await syncScheduleStatus(schedule);
      if (updated && updated.status !== before) {
        console.log(`[SCHEDULER] ${schedule._id}: ${before} → ${updated.status}`);
      }
    }
  } catch (err) {
    console.error('[SCHEDULER] Error:', err);
  }
});
