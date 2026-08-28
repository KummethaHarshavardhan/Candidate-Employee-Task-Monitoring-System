const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const candidateRoutes = require('./routes/candidateRoutes');
const taskRoutes = require('./routes/taskRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const progressRoutes = require('./routes/progressRoutes');
dotenv.config();

connectDB().then(() => {
    bootstrapAdmin();
});
const app = express();
app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/candidates', candidateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/progress', progressRoutes);
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
    // Keep server running in dev mode
});

module.exports = app;