/**
 * Calculates the elapsed business office hours (in milliseconds) between two dates.
 * Excludes weekends (Saturday, Sunday) and non-working hours.
 * 
 * @param {Date|String|Number} startDate 
 * @param {Date|String|Number} endDate 
 * @param {Number} startHour - The hour the workday starts (0-23), defaults to 9
 * @param {Number} endHour - The hour the workday ends (0-23), defaults to 19
 * @param {Array} holidays - Array of holiday date strings (YYYY-MM-DD) for future support
 * @returns {Number} Total business milliseconds
 */
function calculateBusinessMs(startDate, endDate, startHour = 9, endHour = 19, holidays = []) {
  if (!startDate || !endDate) return 0;

  let start = new Date(startDate);
  let end = new Date(endDate);

  if (start > end) return 0;

  let totalMs = 0;
  let current = new Date(start);

  while (current < end) {
    const day = current.getDay();
    
    // If Sunday, skip to next Monday startHour AM
    if (day === 0) { // 0 = Sunday
      current.setDate(current.getDate() + 1);
      current.setHours(startHour, 0, 0, 0);
      continue;
    }
    
    // Future expansion: skip holidays here if matching `holidays` array

    const currentHour = current.getHours();

    // If before office hours, skip forward to startHour AM today
    if (currentHour < startHour) {
      current.setHours(startHour, 0, 0, 0);
      continue;
    }

    // If after or exactly at office end, skip to startHour AM tomorrow
    if (currentHour >= endHour) {
      current.setDate(current.getDate() + 1);
      current.setHours(startHour, 0, 0, 0);
      continue;
    }

    // Calculate end of the current working block
    // It's either the exact end time OR the end of the current office day
    let endOfBlock = new Date(current);
    endOfBlock.setHours(endHour, 0, 0, 0);
    
    if (end < endOfBlock) {
      endOfBlock = new Date(end);
    }

    // Add duration of this block
    totalMs += (endOfBlock.getTime() - current.getTime());
    
    // Move current time past this block
    current = new Date(endOfBlock);
  }

  return totalMs;
}

function getISTDateParts(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
      weekday: "short",
    });

    const parts = formatter.formatToParts(date);
    let hour = 0;
    let weekdayStr = "";

    for (const part of parts) {
      if (part.type === "hour") hour = parseInt(part.value, 10);
      if (part.type === "weekday") weekdayStr = part.value;
    }

    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[weekdayStr] !== undefined ? dayMap[weekdayStr] : date.getDay();
    if (hour === 24) hour = 0;

    return { day, hour };
  } catch (e) {
    return { day: date.getDay(), hour: date.getHours() };
  }
}

async function checkWithinBusinessHours() {
  try {
    let settings = await OfficeSettings.findOne({ key: "global" });
    if (!settings) {
      settings = { startHour: 9, endHour: 19, workingDays: [1, 2, 3, 4, 5, 6] };
    }
    const workingDays =
      settings.workingDays && settings.workingDays.length > 0
        ? settings.workingDays
        : [1, 2, 3, 4, 5, 6];

    const now = new Date();
    const { day, hour: currentHour } = getISTDateParts(now);

    if (!workingDays.includes(day)) {
      return false;
    }
    return currentHour >= settings.startHour && currentHour < settings.endHour;
  } catch (err) {
    return true;
  }
}

module.exports = { calculateBusinessMs, checkWithinBusinessHours, getISTDateParts };
