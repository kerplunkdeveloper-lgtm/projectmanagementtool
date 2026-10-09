const Mom = require("../models/Mom");
const Notification = require("../models/Notification");
const User = require("../models/User");

async function checkOverdueMoms(io) {
  try {
    const now = new Date();
    
    // Find Moms that are overdue (endDate < now), not completed/cancelled, and haven't had an overdue notification sent
    const overdueMoms = await Mom.find({
      endDate: { $lt: now },
      status: { $nin: ['Completed', 'Cancelled', 'Rejected'] },
      overdueNotified: false
    });

    if (overdueMoms.length === 0) return;

    for (const mom of overdueMoms) {
      // Find who to notify: Assigned user + creator
      const recipients = new Set();
      if (mom.assignedTo) {
        recipients.add(mom.assignedTo.toString());
      }
      recipients.add(mom.createdBy.toString());

      // Optionally add admin/operation manager
      const managementUsers = await User.find({
        role: { $in: ['admin', 'operationmanager'] },
      }).select('_id');
      
      managementUsers.forEach(u => recipients.add(u._id.toString()));

      for (const recipientId of recipients) {
        const notification = await Notification.create({
          recipient: recipientId,
          sender: mom.createdBy, // Or system bot if available, using creator for now
          type: 'mom_overdue',
          message: `Warning: MOM point is overdue - ${mom.title}`,
          mom: mom._id
        });

        if (io) {
          io.to(recipientId).emit('new_notification', notification);
        }
      }

      // Mark as notified
      mom.overdueNotified = true;
      await mom.save();
      console.log(`[MomScheduler] Marked MOM as overdue: "${mom.title}"`);
    }
  } catch (err) {
    console.error("Error in checkOverdueMoms background worker:", err);
  }
}

function startMomScheduler(app) {
  // Check every 10 minutes
  setInterval(() => {
    const currentIo = app.get("io");
    if (currentIo) {
      checkOverdueMoms(currentIo);
    }
  }, 10 * 60 * 1000);
}

module.exports = { startMomScheduler, checkOverdueMoms };
