const OfficeSettings = require("../models/OfficeSettings");

/**
 * Gets IST (Asia/Kolkata) day, hour, and minute for a date object.
 * IST is fixed at UTC+5:30 (offset +330 minutes) without Daylight Saving Time.
 */
function getISTDateParts(date = new Date()) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return { day: 0, hour: 0, minute: 0 };
    }
    const istDate = new Date(d.getTime() + 330 * 60 * 1000);
    return {
      day: istDate.getUTCDay(),
      hour: istDate.getUTCHours(),
      minute: istDate.getUTCMinutes(),
    };
  } catch (e) {
    const d = new Date(date);
    return { day: d.getDay(), hour: d.getHours(), minute: d.getMinutes() };
  }
}

/**
 * Calculates elapsed business office hours (in milliseconds) between two dates in Asia/Kolkata IST.
 * Excludes non-working days and non-working hours.
 */
function calculateBusinessMs(startDate, endDate, startTime = "09:00", endTime = "19:00", workingDays = [1, 2, 3, 4, 5, 6], holidays = [], breakStartTime = "13:00", breakEndTime = "14:00") {
  if (!startDate || !endDate) return 0;
  let start = new Date(startDate).getTime();
  let end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end) || start >= end) return 0;

  const IST_OFFSET = 330 * 60 * 1000;
  let totalMs = 0;
  
  const parseTime = (t) => typeof t === 'string' ? t.split(':').map(Number) : [Number(t) || 0, 0];
  const [startH, startM] = parseTime(startTime);
  const [endH, endM] = parseTime(endTime);

  let curTime = start;
  while (curTime < end) {
    const curIST = new Date(curTime + IST_OFFSET);
    const day = curIST.getUTCDay();
    const hour = curIST.getUTCHours();
    const min = curIST.getUTCMinutes();
    const sec = curIST.getUTCSeconds();
    const ms = curIST.getUTCMilliseconds();

    if (!workingDays.includes(day)) {
      // Non-working day (e.g. Sunday): skip forward to next day midnight IST
      const msToday = (hour * 3600 + min * 60 + sec) * 1000 + ms;
      curTime += (24 * 3600 * 1000 - msToday);
      continue;
    }

    if (hour < startH || (hour === startH && min < startM)) {
      // Before start time: advance to start time today IST
      const msUntilStart = ((startH - hour) * 3600 + (startM - min) * 60 - sec) * 1000 - ms;
      curTime += msUntilStart;
      continue;
    }

    if (hour > endH || (hour === endH && min >= endM)) {
      // After or at end time: advance to next day midnight IST
      const msToday = (hour * 3600 + min * 60 + sec) * 1000 + ms;
      curTime += (24 * 3600 * 1000 - msToday);
      continue;
    }

    // Inside office working hours block today
    const curBlockEndIST = new Date(curIST);
    curBlockEndIST.setUTCHours(endH, endM, 0, 0);
    const curBlockEndTime = curBlockEndIST.getTime() - IST_OFFSET;

    const blockEnd = Math.min(end, curBlockEndTime);
    totalMs += (blockEnd - curTime);
    curTime = blockEnd;
  }

  return totalMs;
}

async function checkWithinBusinessHours() {
  try {
    let settings = await OfficeSettings.findOne({ key: "global" });
    if (!settings) {
      settings = { startTime: "09:00", endTime: "19:00", workingDays: [1, 2, 3, 4, 5, 6] };
    }
    const workingDays =
      settings.workingDays && settings.workingDays.length > 0
        ? settings.workingDays
        : [1, 2, 3, 4, 5, 6];

    const startTime = settings.startTime ?? "09:00";
    const endTime = settings.endTime ?? "19:00";
    
    const parseTime = (t) => typeof t === 'string' ? t.split(':').map(Number) : [Number(t) || 0, 0];
    const [startH, startM] = parseTime(startTime);
    const [endH, endM] = parseTime(endTime);

    const now = new Date();
    const { day, hour: currentHour, minute: currentMin } = getISTDateParts(now);

    if (!workingDays.includes(day)) {
      return false;
    }
    
    const currentTotalMin = currentHour * 60 + currentMin;
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;
    
    return currentTotalMin >= startTotalMin && currentTotalMin < endTotalMin;
  } catch (err) {
    return true;
  }
}

module.exports = { calculateBusinessMs, checkWithinBusinessHours, getISTDateParts };

