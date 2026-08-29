const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Submission = require('../models/Submission');
const Review = require('../models/Review');

dotenv.config();

const demoEmails = [
  'alex.johnson@enterprise.com',
  'brenda.miller@enterprise.com',
  'carlos.rivera@enterprise.com',
  'diana.prince@enterprise.com',
  'evan.wright@enterprise.com',
  'fiona.gallagher@enterprise.com',
  'george.clark@enterprise.com',
  'hannah.abbott@enterprise.com',
  'admin@example.com',
  'reviewer@example.com',
];

const cleanupDemoData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/candidate_task_monitoring_db';
    console.log(`[Cleanup] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Cleanup] Identifying demo records...');
    const demoCandidates = await Candidate.find({ email: { $in: demoEmails } });
    const demoCandidateIds = demoCandidates.map((c) => c._id);

    const demoAssignments = await TaskAssignment.find({ candidate: { $in: demoCandidateIds } });
    const demoAssignmentIds = demoAssignments.map((a) => a._id);

    const demoSubmissions = await Submission.find({
      $or: [
        { candidate: { $in: demoCandidateIds } },
        { taskAssignment: { $in: demoAssignmentIds } },
      ],
    });
    const demoSubmissionIds = demoSubmissions.map((s) => s._id);

    const deletedReviews = await Review.deleteMany({
      $or: [
        { submission: { $in: demoSubmissionIds } },
        { taskAssignment: { $in: demoAssignmentIds } },
      ],
    });

    const deletedSubmissions = await Submission.deleteMany({ _id: { $in: demoSubmissionIds } });
    const deletedAssignments = await TaskAssignment.deleteMany({ _id: { $in: demoAssignmentIds } });
    const deletedCandidates = await Candidate.deleteMany({ _id: { $in: demoCandidateIds } });
    const deletedUsers = await User.deleteMany({ email: { $in: demoEmails } });

    console.log('\n[Cleanup Report]');
    console.log(`✓ Deleted ${deletedUsers.deletedCount} demo users`);
    console.log(`✓ Deleted ${deletedCandidates.deletedCount} demo candidates`);
    console.log(`✓ Deleted ${deletedAssignments.deletedCount} demo assignments`);
    console.log(`✓ Deleted ${deletedSubmissions.deletedCount} demo submissions`);
    console.log(`✓ Deleted ${deletedReviews.deletedCount} demo reviews`);
    console.log('✓ All real candidate accounts, real user accounts, and real tasks have been PRESERVED.');

    await mongoose.disconnect();
    console.log('[Cleanup] Completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup Error]:', error);
    process.exit(1);
  }
};

cleanupDemoData();
