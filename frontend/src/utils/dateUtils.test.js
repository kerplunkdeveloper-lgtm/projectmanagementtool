import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatLocalDateKey,
  formatLocalTimeKey,
  parseLocalDateTime,
  parseLocalDateOnly,
} from './dateUtils.js';

describe('Social Media Task Calendar Date Regression Tests', () => {
  // Test 1: 2026-10-26 remains 26 October in the calendar
  it('1. 2026-10-26 remains 26 October in calendar dateKey and task grouping', () => {
    // Simulated calendar day cell for 26 October 2026
    const cellDate26 = new Date(2026, 9, 26); // Oct 26 local midnight
    const cellDateKey26 = formatLocalDateKey(cellDate26);
    assert.strictEqual(cellDateKey26, '2026-10-26', 'Cell dateKey must be 2026-10-26');

    // Simulated calendar day cell for 27 October 2026
    const cellDate27 = new Date(2026, 9, 27);
    const cellDateKey27 = formatLocalDateKey(cellDate27);
    assert.strictEqual(cellDateKey27, '2026-10-27', 'Cell dateKey must be 2026-10-27');

    // Simulated task with publishDate on 26-10-2026 at 18:00
    const taskPublishDate = parseLocalDateTime('2026-10-26', '18:00');
    const taskGroupingKey = formatLocalDateKey(taskPublishDate);
    assert.strictEqual(taskGroupingKey, '2026-10-26', 'Task grouping key must be 2026-10-26');

    // Task MUST match cell 26 and NOT cell 27
    assert.strictEqual(taskGroupingKey === cellDateKey26, true, 'Task must appear on 26 October');
    assert.strictEqual(taskGroupingKey === cellDateKey27, false, 'Task must NOT appear on 27 October');
  });

  // Test 2: Publish time remains 18:00
  it('2. Publish time remains 18:00 without shift', () => {
    const publishDate = parseLocalDateTime('2026-10-26', '18:00');
    const timeStr = formatLocalTimeKey(publishDate);
    assert.strictEqual(timeStr, '18:00', 'Publish time must remain 18:00');
  });

  // Test 3: Due Date remains independent of Publish Date
  it('3. Due Date remains independent of Publish Date', () => {
    const publishDate = parseLocalDateTime('2026-10-26', '18:00');
    const dueDate = parseLocalDateOnly('2026-10-28');

    assert.notStrictEqual(
      formatLocalDateKey(publishDate),
      formatLocalDateKey(dueDate),
      'Publish date and Due date must remain different'
    );
    assert.strictEqual(formatLocalDateKey(publishDate), '2026-10-26');
    assert.strictEqual(formatLocalDateKey(dueDate), '2026-10-28');
  });

  // Test 4: Editing and reopening a task preserves the selected dates
  it('4. Editing and reopening a task preserves the selected dates', () => {
    // Task created with Publish Date: 2026-10-26, Time: 18:00, Due Date: 2026-10-26
    const initialSavedPublishDate = parseLocalDateTime('2026-10-26', '18:00');
    const initialSavedDueDate = parseLocalDateOnly('2026-10-26');

    // Mock stored task object
    const storedTask = {
      publishDate: initialSavedPublishDate.toISOString(),
      dueDate: initialSavedDueDate.toISOString(),
    };

    // When modal reopens and parses storedTask:
    const reopenedPublishDate = formatLocalDateKey(storedTask.publishDate);
    const reopenedPublishTime = formatLocalTimeKey(storedTask.publishDate);
    const reopenedDueDate = formatLocalDateKey(storedTask.dueDate);

    assert.strictEqual(reopenedPublishDate, '2026-10-26', 'Reopened publish date must match 2026-10-26');
    assert.strictEqual(reopenedPublishTime, '18:00', 'Reopened publish time must match 18:00');
    assert.strictEqual(reopenedDueDate, '2026-10-26', 'Reopened due date must match 2026-10-26');
  });

  // Test 5: Date behavior is correct across all hours in Asia/Kolkata timezone
  it('5. Date behavior is correct across early morning and late night times', () => {
    // Early morning in Asia/Kolkata (e.g. 01:30 AM local time, which in UTC is previous day 20:00)
    const earlyMorning = parseLocalDateTime('2026-10-26', '01:30');
    assert.strictEqual(formatLocalDateKey(earlyMorning), '2026-10-26');
    assert.strictEqual(formatLocalTimeKey(earlyMorning), '01:30');

    // Late night in Asia/Kolkata (e.g. 23:45 local time)
    const lateNight = parseLocalDateTime('2026-10-26', '23:45');
    assert.strictEqual(formatLocalDateKey(lateNight), '2026-10-26');
    assert.strictEqual(formatLocalTimeKey(lateNight), '23:45');

    // Month boundary: Nov 1 vs Oct 31
    const endOfMonth = parseLocalDateTime('2026-10-31', '23:59');
    assert.strictEqual(formatLocalDateKey(endOfMonth), '2026-10-31');
    const startOfNextMonth = parseLocalDateTime('2026-11-01', '00:00');
    assert.strictEqual(formatLocalDateKey(startOfNextMonth), '2026-11-01');
  });
});
