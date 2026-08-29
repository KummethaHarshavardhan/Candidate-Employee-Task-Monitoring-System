const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const taskRoutes = require('./routes/taskRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bootstrapAdmin = require('./utils/bootstrapAdmin');

// Load env variables
dotenv.config();

// Connect to Database & bootstrap admin if configured
connectDB().then(() => {
  bootstrapAdmin();
});

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    message: 'Candidate/Employee Task Monitoring System API is healthy and running',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  // Keep server running in dev mode
});

module.exports = app;
