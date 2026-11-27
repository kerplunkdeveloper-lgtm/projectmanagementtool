/**
 * One-off fix for Daily Work Schedule records saved before the timezone fix.
 * Re-derives each completed slot's on-time / late status from its completedAt (IST)
 * and recalculates the stored counts used by the executives summary.
 *
 * Usage (from backend/):  node scripts/recalculateDailyScheduleTiming.js [--dry-run]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const SmDailySchedule = require('../models/SmDailySchedule');
const { _internal } = require('../controllers/smDailyScheduleController');

const dryRun = process.argv.includes('--dry-run');

async function run() {
  await connectDB();
  let scanned = 0;
  let changed = 0;

  const cursor = SmDailySchedule.find({}).cursor();
  for await (const doc of cursor) {
    scanned++;
    const before = JSON.stringify([doc.onTimeSlotsCount, doc.delayedSlotsCount, doc.slots.map((s) => s.timingStatus)]);
    _internal.recalculateScheduleStats(doc);
    const after = JSON.stringify([doc.onTimeSlotsCount, doc.delayedSlotsCount, doc.slots.map((s) => s.timingStatus)]);
    if (before !== after) {
      changed++;
      console.log(`${doc.date} ${doc.userName || doc.user}: on-time ${doc.onTimeSlotsCount}, late ${doc.delayedSlotsCount}`);
      if (!dryRun) await doc.save();
    }
  }

  console.log(`\nScanned ${scanned} schedules, ${changed} ${dryRun ? 'would change' : 'updated'}.`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close();
  process.exit(1);
});
