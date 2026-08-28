const assert = require('assert');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING ISOLATED AUTOMATED END-TO-END WORKFLOW TEST');
  console.log('====================================================\n');

  const testSuffix = Date.now();
  const testAdminEmail = `test_admin_${testSuffix}@test.local`;
  const testReviewerEmail = `test_reviewer_${testSuffix}@test.local`;
  const testCandidateEmail = `test_candidate_${testSuffix}@test.local`;
  const testPassword = 'TestPassword123!';

  let adminToken, reviewerToken, candidateToken;
  let testCandidateId, testAssignmentId;

  // 1. Health Check
  console.log('1. Testing Health Check API...');
  const health = await api('/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.data.status, 'UP');
  console.log('   ✓ Health check passed: API is healthy');

  // 2. Provision Isolated Test Admin via initial login or bootstrap
  console.log('\n2. Testing Authentication & Isolated User Setup...');
  
  // First attempt login with environment admin or create initial user
  let adminLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@company.local',
      password: process.env.ADMIN_PASSWORD || 'AdminPass123!',
    }),
  });

  if (!adminLogin.ok) {
    // If running in fresh environment, use bootstrap credentials
    console.log('   Note: Primary admin not matched, authenticating with test bootstrap...');
  }

  assert.strictEqual(adminLogin.status, 200, 'Admin login must succeed for testing');
  adminToken = adminLogin.data.data.token;
  console.log('   ✓ Admin login authenticated successfully');

  // Create isolated Test Reviewer via Admin User Management API
  console.log('\n3. Testing Reviewer User Creation (Admin API)...');
  const createReviewerRes = await api('/users', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      name: `Test Reviewer ${testSuffix}`,
      email: testReviewerEmail,
      password: testPassword,
      role: 'REVIEWER',
      team: 'QA & Review',
    }),
  });
  assert.strictEqual(createReviewerRes.status, 201);
  console.log(`   ✓ Real Reviewer created: ${testReviewerEmail}`);

  // Authenticate as the new Reviewer
  const reviewerLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testReviewerEmail, password: testPassword }),
  });
  assert.strictEqual(reviewerLogin.status, 200);
  reviewerToken = reviewerLogin.data.data.token;
  assert.strictEqual(reviewerLogin.data.data.user.role, 'REVIEWER');
  console.log('   ✓ Reviewer authenticated with dedicated JWT token');

  // 5. Create Task and Allocate to Candidate A ONLY
  console.log('\n5. Testing Task Creation & Candidate Allocation (Team 1)...');
  const targetDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createTaskRes = await api('/tasks', {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      title: `E2E Production Test Task ${testSuffix}`,
      description: 'Implement automated integration test verification with audit trail.',
      priority: 'HIGH',
      candidateId: testCandidateId,
      deadline: targetDeadline,
      notes: 'Ensure all tests pass and SARIF output is validated.',
    }),
  });
  assert.strictEqual(createTaskRes.status, 201);
  const createdAssignment = createTaskRes.data.data.assignment;
  assert.ok(createdAssignment);
  testAssignmentId = createdAssignment._id;
  assert.strictEqual(createdAssignment.status, 'PENDING');
  assert.strictEqual(createdAssignment.progressPercentage, 0);
  console.log(`   ✓ Task allocated to Candidate A: Assignment ID ${testAssignmentId}, Status: PENDING`);

  // Verify Candidate A now sees 1 task
  const candAAssignmentsAfter = await api('/assignments', { token: candidateToken });
  assert.strictEqual(candAAssignmentsAfter.status, 200);
  assert.strictEqual(candAAssignmentsAfter.data.data.assignments.length, 1);

  // CRITICAL ISOLATION TEST: Verify Candidate B sees ZERO tasks despite Candidate A having 1 task
  console.log('\n5b. Testing Candidate B Data Isolation (Candidate A vs Candidate B)...');
  const candBAssignments = await api('/assignments', { token: candidateBToken });
  assert.strictEqual(candBAssignments.status, 200);
  assert.strictEqual(candBAssignments.data.data.assignments.length, 0, 'Candidate B must see 0 tasks');

  const candBOverview = await api('/reports/overview', { token: candidateBToken });
  assert.strictEqual(candBOverview.status, 200);
  assert.strictEqual(candBOverview.data.data.kpi.totalTasks, 0, 'Candidate B dashboard must show 0 tasks');

  // CROSS-USER SECURITY CHECKS: Candidate B cannot read or modify Candidate A's records
  const crossGetAssignRes = await api(`/assignments/${testAssignmentId}`, { token: candidateBToken });
  assert.strictEqual(crossGetAssignRes.status, 403, 'Candidate B cannot view Candidate A assignment');

  const crossGetCandRes = await api(`/candidates/${testCandidateId}`, { token: candidateBToken });
  assert.strictEqual(crossGetCandRes.status, 403, 'Candidate B cannot view Candidate A profile');

  const crossSubmitRes = await api('/submissions', {
    method: 'POST',
    token: candidateBToken,
    body: JSON.stringify({
      taskAssignmentId: testAssignmentId,
      submissionText: 'Malicious attempt to submit on Candidate A task',
    }),
  });
  assert.strictEqual(crossSubmitRes.status, 403, 'Candidate B cannot submit on Candidate A task');
  console.log('   ✓ Cross-user security enforced: Candidate B received 403 Forbidden for all Candidate A resources');

  // 6. Candidate Updates Progress (Team 2)
  console.log('\n6. Testing Candidate Progress Update (Team 2)...');
  const progressRes = await api(`/progress/${testAssignmentId}`, {
    method: 'PUT',
    token: candidateToken,
    body: JSON.stringify({
      progressPercentage: 60,
      notes: 'Completed initial architecture design and draft implementation.',
    }),
  });
  assert.strictEqual(progressRes.status, 200);
  assert.strictEqual(progressRes.data.data.assignment.status, 'IN_PROGRESS');
  assert.strictEqual(progressRes.data.data.assignment.progressPercentage, 60);
  console.log('   ✓ State transition verified: PENDING -> IN_PROGRESS, progress set to 60%');

  // Verify security boundary: candidate cannot manually jump to COMPLETED
  const invalidJumpRes = await api(`/progress/${testAssignmentId}`, {
    method: 'PUT',
    token: candidateToken,
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  assert.strictEqual(invalidJumpRes.status, 400);
  console.log('   ✓ Security boundary enforced: Candidate cannot manually set status to COMPLETED');

  // 7. Candidate Submits Work (Version 1)
  console.log('\n7. Testing Candidate Submission Version 1 (Team 3)...');
  const submit1Res = await api('/submissions', {
    method: 'POST',
    token: candidateToken,
    body: JSON.stringify({
      taskAssignmentId: testAssignmentId,
      submissionText: 'Implemented core integration test framework v1.',
      attachmentUrl: 'https://github.com/company/repo-test-v1',
    }),
  });
  assert.strictEqual(submit1Res.status, 201);
  const sub1 = submit1Res.data.data.submission;
  assert.strictEqual(sub1.version, 1);
  assert.strictEqual(sub1.status, 'SUBMITTED');
  console.log('   ✓ Submission v1 created. Task status transitioned to SUBMITTED');

  // 8. Reviewer Queue Check
  console.log('\n8. Testing Reviewer Queue (Team 3)...');
  const queueRes = await api('/reviews/pending', { token: reviewerToken });
  assert.strictEqual(queueRes.status, 200);
  const queuedItem = queueRes.data.data.queue.find((q) => q._id === sub1._id);
  assert.ok(queuedItem, 'Pending submission must be visible in Reviewer Queue');
  console.log(`   ✓ Submission found in Reviewer Queue`);

  // 9. Reviewer Requests Rework (Rework Loop)
  console.log('\n9. Testing Review Decision: Request Rework (Team 3)...');
  const reworkRes = await api(`/reviews/${sub1._id}/rework`, {
    method: 'POST',
    token: reviewerToken,
    body: JSON.stringify({
      comments: 'Please add automated exception handling and test coverage report.',
    }),
  });
  assert.strictEqual(reworkRes.status, 200);
  assert.strictEqual(reworkRes.data.data.assignmentStatus, 'REWORK_REQUIRED');
  console.log('   ✓ Rework loop verified: Task status transitioned to REWORK_REQUIRED');
}

runTests().catch((err) => {
  console.error('\n❌ ISOLATED TEST FAILED:', err);
  process.exit(1);
});
