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

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Set security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);

// Route files
const auth = require('./routes/authRoutes');
app.use('/api/users', users);
const profiles = require('./routes/profileRoutes');
const projects = require('./routes/projectRoutes');
const clientRoutes = require(
  "./routes/clientRoutes"
);

app.get("/", (req, res) => {
  res.send("hello");
});



// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/profile', profiles);
app.use('/api/projects', projects);
app.use('/api/clients', clientRoutes);
app.use('/api/templates', templateRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});