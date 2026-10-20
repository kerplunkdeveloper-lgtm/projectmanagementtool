const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Task = require('./models/Task');
const User = require('./models/User');

async function test() {
  await connectDB();
  const start = Date.now();
  
  const userDeptQuery = {
    $or: [
      { department: { $regex: /graphic|design/i } },
      { role: { $regex: /graphic|design/i } }
    ]
  };
  const users = await User.find(userDeptQuery).select('_id').lean();
  console.log('Users found:', users.length, 'Time:', Date.now() - start, 'ms');
  
  const userIds = users.map(u => u._id);
  const taskStart = Date.now();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  const query = {
    $and: [
      {
        $or: [
          { assignedTo: { $in: userIds } },
          { 'subtasks.assignedTo': { $in: userIds } }
        ]
      },
      {
        $or: [
          { status: { $nin: ['Completed', 'Rejected', 'Approved', 'Cancelled'] } },
          { updatedAt: { $gte: fourteenDaysAgo } },
          { completedAt: { $gte: fourteenDaysAgo } },
          { rejectedAt: { $gte: fourteenDaysAgo } }
        ]
      }
    ]
  };
  
  const tasksRaw = await Task.find(query).sort({ updatedAt: -1 }).lean();
  console.log('Raw tasks count:', tasksRaw.length, 'Time:', Date.now() - taskStart, 'ms');
  
  const popStart = Date.now();
  const tasksPop = await Task.find(query)
    .sort({ updatedAt: -1 })
    .populate({
      path: 'project',
      select: 'name client',
      populate: { path: 'client', select: 'companyName color icon' }
    })
    .populate({
      path: 'assignedTo',
      select: 'name email department profile',
      populate: { path: 'profile', select: 'profileImage' }
    })
    .populate({ path: 'createdBy', select: 'name email department' })
    .populate({ path: 'subtasks.assignedTo', select: 'name email department' })
    .lean();
  console.log('Populated tasks time:', Date.now() - popStart, 'ms');
  
  await mongoose.connection.close();
}
test();
