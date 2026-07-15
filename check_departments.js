const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

dotenv.config({ path: './backend/config/config.env' });
// Try loading config path, if not, fallback to default URI
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/projectmanagementtool";

mongoose.connect(mongoUri)
  .then(async () => {
    const users = await User.find({});
    console.log("Total users count:", users.length);
    const depts = {};
    users.forEach(u => {
      depts[u.department || 'No Department'] = (depts[u.department || 'No Department'] || 0) + 1;
    });
    console.log("Departments list:");
    console.log(JSON.stringify(depts, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
