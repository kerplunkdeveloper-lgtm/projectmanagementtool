const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const users = require('./routes/userRoutes');
const templateRoutes = require('./routes/templateRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());


const allowedOrigins = [
  "http://localhost:5173",
  "https://projecttoolmanagement.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Set security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1000,
});
app.use(limiter);

// Route files
const auth = require('./routes/authRoutes');
const profiles = require('./routes/profileRoutes');

const clientRoutes = require(
  "./routes/clientRoutes"
);
const eodReports = require('./routes/eodReportRoutes');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const businessProjectRoutes = require("./routes/businessProjectRoutes");
const overheadRoutes = require("./routes/overheadRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.get("/", (req, res) => {
  res.send("hello");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date(),
    message: "Server is healthy",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date(),
    message: "Server is healthy",
  });
});



// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/profile', profiles);

app.use('/api/clients', clientRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/eod-reports', eodReports);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/business-projects', businessProjectRoutes);
app.use('/api/overheads', overheadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;




const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    socket.join("group_chat");
    console.log(`User ${userId} joined room & group_chat`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible to our routers
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});