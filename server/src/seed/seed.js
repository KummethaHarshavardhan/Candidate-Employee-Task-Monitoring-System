const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Submission = require('../models/Submission');
const Review = require('../models/Review');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/candidate_task_monitoring_db';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Candidate.deleteMany({});
    await Task.deleteMany({});
    await TaskAssignment.deleteMany({});
    await Submission.deleteMany({});
    await Review.deleteMany({});

    console.log('[Seed] Creating Candidates...');
    const candidates = await Candidate.create([
      {
        name: 'Alex Johnson (Candidate A)',
        email: 'alex.johnson@enterprise.com',
        phone: '+1 555-0101',
        department: 'Frontend Engineering',
        designation: 'Associate React Developer',
        team: 'Team Alpha',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Brenda Miller (Candidate B)',
        email: 'brenda.miller@enterprise.com',
        phone: '+1 555-0102',
        department: 'Backend Engineering',
        designation: 'Node.js Developer Trainee',
        team: 'Team Alpha',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Carlos Rivera (Candidate C)',
        email: 'carlos.rivera@enterprise.com',
        phone: '+1 555-0103',
        department: 'DevOps & Cloud',
        designation: 'Cloud Engineer Intern',
        team: 'Team Beta',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Diana Prince (Candidate D)',
        email: 'diana.prince@enterprise.com',
        phone: '+1 555-0104',
        department: 'Quality Assurance',
        designation: 'QA Automation Engineer',
        team: 'Team Beta',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Evan Wright (Candidate E)',
        email: 'evan.wright@enterprise.com',
        phone: '+1 555-0105',
        department: 'Frontend Engineering',
        designation: 'UI/UX Developer',
        team: 'Team Gamma',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Fiona Gallagher (Candidate F)',
        email: 'fiona.gallagher@enterprise.com',
        phone: '+1 555-0106',
        department: 'Backend Engineering',
        designation: 'API Specialist',
        team: 'Team Gamma',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'George Clark (Candidate G)',
        email: 'george.clark@enterprise.com',
        phone: '+1 555-0107',
        department: 'Data Engineering',
        designation: 'Data Analyst Trainee',
        team: 'Team Delta',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Hannah Abbott (Candidate H)',
        email: 'hannah.abbott@enterprise.com',
        phone: '+1 555-0108',
        department: 'Product Design',
        designation: 'Junior UX Designer',
        team: 'Team Delta',
        status: 'ACTIVE',
        joiningDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('[Seed] Creating Users (Admin, Reviewer, Candidates)...');
    const adminUser = await User.create({
      name: 'Sarah Connor (Admin)',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'ADMIN',
      team: 'Management',
    });

    const reviewerUser = await User.create({
      name: 'Marcus Vance (Lead Reviewer)',
      email: 'reviewer@example.com',
      password: 'reviewer123',
      role: 'REVIEWER',
      team: 'Technical Review Board',
    });

    // Candidate Users for logging in directly as candidates
    const candidateUserA = await User.create({
      name: 'Alex Johnson (Candidate A)',
      email: 'alex.johnson@enterprise.com',
      password: 'candidate123',
      role: 'CANDIDATE',
      team: 'Team Alpha',
      candidateId: candidates[0]._id,
    });

    const candidateUserB = await User.create({
      name: 'Brenda Miller (Candidate B)',
      email: 'brenda.miller@enterprise.com',
      password: 'candidate123',
      role: 'CANDIDATE',
      team: 'Team Alpha',
      candidateId: candidates[1]._id,
    });

    const candidateUserC = await User.create({
      name: 'Carlos Rivera (Candidate C)',
      email: 'carlos.rivera@enterprise.com',
      password: 'candidate123',
      role: 'CANDIDATE',
      team: 'Team Beta',
      candidateId: candidates[2]._id,
    });

    const candidateUserD = await User.create({
      name: 'Diana Prince (Candidate D)',
      email: 'diana.prince@enterprise.com',
      password: 'candidate123',
      role: 'CANDIDATE',
      team: 'Team Beta',
      candidateId: candidates[3]._id,
    });

    const candidateUserE = await User.create({
      name: 'Evan Wright (Candidate E)',
      email: 'evan.wright@enterprise.com',
      password: 'candidate123',
      role: 'CANDIDATE',
      team: 'Team Gamma',
      candidateId: candidates[4]._id,
    });

    console.log('[Seed] Creating Centralized Tasks...');
    const tasks = await Task.create([
      {
        title: 'Design System & Accessible Component Library',
        description: 'Build a fully WCAG compliant button, modal, and input component library in React with high test coverage.',
        priority: 'HIGH',
        createdBy: adminUser._id,
      },
      {
        title: 'REST API Authentication & JWT Refresh Tokens',
        description: 'Implement JWT authentication with role authorization, bcrypt hashing, and secure token expiration in Express.',
        priority: 'URGENT',
        createdBy: adminUser._id,
      },
      {
        title: 'Dockerize Microservices & Setup CI/CD Pipeline',
        description: 'Create multi-stage Dockerfiles and GitHub Actions workflow for automated testing and container image publishing.',
        priority: 'MEDIUM',
        createdBy: reviewerUser._id,
      },
      {
        title: 'End-to-End Cypress & Playwright Test Suite',
        description: 'Write end-to-end integration tests covering user registration, task submission, and reviewer approval workflows.',
        priority: 'HIGH',
        createdBy: reviewerUser._id,
      },
      {
        title: 'Responsive Analytics Dashboard with Charts',
        description: 'Develop interactive SVG/Canvas charts for deadline metrics, candidate throughput, and team velocity breakdown.',
        priority: 'URGENT',
        createdBy: adminUser._id,
      },
      {
        title: 'Database Indexing & Query Optimization',
        description: 'Analyze MongoDB slow query logs, implement compound indexes, and reduce aggregation pipeline latency under 50ms.',
        priority: 'MEDIUM',
        createdBy: reviewerUser._id,
      },
      {
        title: 'ETL Pipeline for Monthly Performance Reports',
        description: 'Build automated batch data export script generating CSV and JSON analytical summaries for HR review.',
        priority: 'LOW',
        createdBy: adminUser._id,
      },
      {
        title: 'User Onboarding UX Flow & Interactive Tour',
        description: 'Design and prototype a lightweight 4-step onboarding modal walkthrough for new candidates.',
        priority: 'LOW',
        createdBy: adminUser._id,
      },
    ]);

    console.log('[Seed] Creating Task Assignments adhering to demo scenario...');
    const now = new Date();

    // 1. Candidate A: Task 1 -> COMPLETED On Time
    const deadlineA = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days in future relative to assigned
    const completedAtA = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // completed yesterday
    const assignmentA = await TaskAssignment.create({
      task: tasks[0]._id,
      candidate: candidates[0]._id,
      assignedBy: adminUser._id,
      assignedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      deadline: deadlineA,
      status: 'COMPLETED',
      progressPercentage: 100,
      completedAt: completedAtA,
      notes: 'Initial assignment completed with full documentation.',
    });

    const submissionA = await Submission.create({
      taskAssignment: assignmentA._id,
      candidate: candidates[0]._id,
      submissionText: 'Completed the component library with full Storybook coverage and zero a11y violations.',
      attachmentUrl: 'https://github.com/enterprise/component-lib-v1',
      version: 1,
      status: 'APPROVED',
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    });

    await Review.create({
      submission: submissionA._id,
      taskAssignment: assignmentA._id,
      reviewer: reviewerUser._id,
      comments: 'Excellent quality! Design tokens are clean and accessibility scores are 100%. Approved.',
      decision: 'APPROVED',
      reviewedAt: completedAtA,
    });

    // 2. Candidate B: Task 2 -> IN_PROGRESS
    const deadlineB = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days from now
    const assignmentB = await TaskAssignment.create({
      task: tasks[1]._id,
      candidate: candidates[1]._id,
      assignedBy: adminUser._id,
      assignedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      deadline: deadlineB,
      status: 'IN_PROGRESS',
      progressPercentage: 65,
      notes: 'Focus on cookie security and middleware unit tests.',
    });

    // 3. Candidate C: Task 3 -> SUBMITTED (in Reviewer Queue)
    const deadlineC = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // tomorrow
    const assignmentC = await TaskAssignment.create({
      task: tasks[2]._id,
      candidate: candidates[2]._id,
      assignedBy: reviewerUser._id,
      assignedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      deadline: deadlineC,
      status: 'SUBMITTED',
      progressPercentage: 100,
      notes: 'Docker images pushed to registry, waiting for final signoff.',
    });

    await Submission.create({
      taskAssignment: assignmentC._id,
      candidate: candidates[2]._id,
      submissionText: 'All microservices have multi-stage Dockerfiles and GitHub actions CI pipeline passes all test steps.',
      attachmentUrl: 'https://github.com/enterprise/cloud-infra-pipeline',
      version: 1,
      status: 'SUBMITTED',
      submittedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    });

    // 4. Candidate D: Task 4 -> REWORK_REQUIRED (demonstrates rework cycle with previous submission v1)
    const deadlineD = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const assignmentD = await TaskAssignment.create({
      task: tasks[3]._id,
      candidate: candidates[3]._id,
      assignedBy: reviewerUser._id,
      assignedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      deadline: deadlineD,
      status: 'REWORK_REQUIRED',
      progressPercentage: 80,
      notes: 'Rework requested on Cypress flaky selectors.',
    });

    const submissionD1 = await Submission.create({
      taskAssignment: assignmentD._id,
      candidate: candidates[3]._id,
      submissionText: 'Draft E2E test suite implemented for candidate authentication and task submission.',
      attachmentUrl: 'https://github.com/enterprise/e2e-tests-v1',
      version: 1,
      status: 'REWORK_REQUIRED',
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    });

    await Review.create({
      submission: submissionD1._id,
      taskAssignment: assignmentD._id,
      reviewer: reviewerUser._id,
      comments: 'Good initial coverage, but 3 tests fail intermittently due to hardcoded timeouts. Please replace them with proper cy.intercept() waits.',
      decision: 'REWORK_REQUIRED',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    });

    // 5. Candidate E: Task 5 -> OVERDUE (past deadline, still IN_PROGRESS)
    const deadlineE = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const assignmentE = await TaskAssignment.create({
      task: tasks[4]._id,
      candidate: candidates[4]._id,
      assignedBy: adminUser._id,
      assignedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      deadline: deadlineE,
      status: 'IN_PROGRESS',
      progressPercentage: 45,
      notes: 'Urgent task - blocked on mock data schemas.',
    });

    // 6. Candidate F: Task 6 -> COMPLETED LATE
    const deadlineF = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // deadline 6 days ago
    const completedAtF = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // completed 2 days ago (> deadline)
    const assignmentF = await TaskAssignment.create({
      task: tasks[5]._id,
      candidate: candidates[5]._id,
      assignedBy: reviewerUser._id,
      assignedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      deadline: deadlineF,
      status: 'COMPLETED',
      progressPercentage: 100,
      completedAt: completedAtF,
      notes: 'Indexes applied after query profiling on staging cluster.',
    });

    const submissionF = await Submission.create({
      taskAssignment: assignmentF._id,
      candidate: candidates[5]._id,
      submissionText: 'Added compound indexes on TaskAssignment and Candidate collections. Query response time improved by 85%.',
      attachmentUrl: 'https://github.com/enterprise/mongo-indexes-patch',
      version: 1,
      status: 'APPROVED',
      submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    });

    await Review.create({
      submission: submissionF._id,
      taskAssignment: assignmentF._id,
      reviewer: reviewerUser._id,
      comments: 'Verified query explain plans. Benchmark latency looks great. Approved.',
      decision: 'APPROVED',
      reviewedAt: completedAtF,
    });

    // 7. Candidate G: Task 7 -> PENDING (new assignment)
    const deadlineG = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // 6 days in future
    const assignmentG = await TaskAssignment.create({
      task: tasks[6]._id,
      candidate: candidates[6]._id,
      assignedBy: adminUser._id,
      assignedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      deadline: deadlineG,
      status: 'PENDING',
      progressPercentage: 0,
      notes: 'Read the spec before beginning development.',
    });

    // Additional active tasks for team balance
    await TaskAssignment.create({
      task: tasks[7]._id,
      candidate: candidates[7]._id,
      assignedBy: adminUser._id,
      assignedAt: new Date(),
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      progressPercentage: 0,
      notes: 'Figma link provided in task description.',
    });

    console.log('[Seed] Database seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('DEMO ACCOUNTS READY:');
    console.log('1. Admin:     admin@example.com / admin123');
    console.log('2. Reviewer:  reviewer@example.com / reviewer123');
    console.log('3. Candidate: alex.johnson@enterprise.com / candidate123');
    console.log('4. Candidate: diana.prince@enterprise.com / candidate123 (Rework State)');
    console.log('5. Candidate: carlos.rivera@enterprise.com / candidate123 (Submitted State)');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();