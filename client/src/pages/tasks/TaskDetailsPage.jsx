import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { progressService } from '../../services/progressService';
import { submissionService } from '../../services/submissionService';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge/PriorityBadge';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Badge } from '../../components/common/Badge/Badge';
import { Modal } from '../../components/common/Modal/Modal';
import { Input } from '../../components/common/Input/Input';
import { LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const TaskDetailsPage = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);

  // Progress Update State
  const [currentProgress, setCurrentProgress] = useState(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Submit Work Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review Modals State (Approve / Rework)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assignmentService.getAssignmentById(id);
      const data = res.data?.assignment;
      setAssignment(data);
      setCurrentProgress(data?.progressPercentage || 0);
    } catch (err) {
      console.error('Failed to load assignment details:', err);
      setError(err.message || 'Failed to load task assignment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  const handleProgressChange = async () => {
    try {
      setUpdatingProgress(true);
      await progressService.updateTaskProgress(assignment._id, {
        progressPercentage: currentProgress,
      });
      toast.success(`Task progress updated to ${currentProgress}%`, 'Progress Saved');
      fetchAssignmentDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update progress', 'Error');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submissionText) {
      toast.warning('Please provide submission notes or a description', 'Missing Details');
      return;
    }

    try {
      setSubmitting(true);
      await submissionService.createSubmission({
        taskAssignmentId: assignment._id,
        submissionText,
        attachmentUrl,
      });

      toast.success('Task submitted successfully for review', 'Work Submitted');
      setIsSubmitModalOpen(false);
      setSubmissionText('');
      setAttachmentUrl('');
      fetchAssignmentDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to submit work', 'Submission Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    const latestSubmission = assignment.submissions?.[assignment.submissions.length - 1];
    if (!latestSubmission) {
      toast.warning('No active submission to approve', 'Error');
      return;
    }

    try {
      setReviewing(true);
      await reviewService.approveSubmission(latestSubmission._id, reviewComments);
      toast.success('Submission approved and task completed', 'Approved');
      setIsApproveModalOpen(false);
      setReviewComments('');
      fetchAssignmentDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to approve submission', 'Review Error');
    } finally {
      setReviewing(false);
    }
  };

  const handleRequestRework = async () => {
    if (!reviewComments.trim()) {
      toast.warning('Please enter feedback comments for the rework request', 'Feedback Required');
      return;
    }

    const latestSubmission = assignment.submissions?.[assignment.submissions.length - 1];
    if (!latestSubmission) {
      toast.warning('No active submission to review', 'Error');
      return;
    }

    try {
      setReviewing(true);
      await reviewService.reworkSubmission(latestSubmission._id, reviewComments);
      toast.success('Rework requested successfully', 'Rework Cycle Initiated');
      setIsReworkModalOpen(false);
      setReviewComments('');
      fetchAssignmentDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to request rework', 'Review Error');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size={40} text="Loading task details, submissions & review logs..." />;
  }

  if (error || !assignment) {
    return <ErrorState title="Task Not Found" message={error} onRetry={fetchAssignmentDetails} />;
  }

  const isCandidateUser = role === 'CANDIDATE';
  const canReview = (role === 'ADMIN' || role === 'REVIEWER') && assignment.status === 'SUBMITTED';
  const canSubmit = assignment.status === 'PENDING' || assignment.status === 'IN_PROGRESS' || assignment.status === 'REWORK_REQUIRED';

  // Stepper calculations
  const steps = [
    { label: 'PENDING', key: 'PENDING' },
    { label: 'IN PROGRESS', key: 'IN_PROGRESS' },
    { label: 'SUBMITTED', key: 'SUBMITTED' },
    { label: 'REVIEW', key: 'REVIEW' },
    { label: 'COMPLETED', key: 'COMPLETED' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'IN_PROGRESS':
        return 1;
      case 'SUBMITTED':
        return 2;
      case 'REWORK_REQUIRED':
        return 1; // back to in-progress
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(assignment.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/tasks">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Tasks
          </Button>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <PriorityBadge priority={assignment.task?.priority} />
          <StatusBadge status={assignment.status} isOverdue={assignment.isOverdue} />
        </div>
      </div>

      {/* Task Lifecycle Stepper */}
      <Card>
        <div className="workflow-stepper">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx || assignment.status === 'COMPLETED';
            const isActive = idx === currentStepIdx && assignment.status !== 'COMPLETED';

            return (
              <div
                key={step.key}
                className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div className="step-label">{step.label}</div>
              </div>
            );
          })}
        </div>
        {assignment.status === 'REWORK_REQUIRED' && (
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: 'var(--warning-light)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              color: '#fde68a',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            <AlertTriangle size={18} color="var(--warning)" />
            <span>
              <strong>Rework Required:</strong> Please review the feedback below, make the necessary revisions, and resubmit when ready.
            </span>
          </div>
        )}
      </Card>

      {/* Task Overview & Assignee Details */}
      <div className="grid grid-3 gap-6">
        {/* Left Column: Task Specification */}
        <Card style={{ gridColumn: 'span 2' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {assignment.task?.title}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>Version: {assignment.assignmentVersion || 1}</span>
              <span>Assigned By: {assignment.assignedBy?.name || 'Admin'}</span>
              <span>
                Assigned Date: {new Date(assignment.assignedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Task Description & Deliverables
            </h4>
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}
            >
              {assignment.task?.description}
            </div>
          </div>

          {assignment.notes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Assignment Notes
              </h4>
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                {assignment.notes}
              </div>
            </div>
          )}

          {/* Interactive Candidate Progress & Submission Section */}
          {canSubmit && (
            <div
              style={{
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '1.25rem',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Update Progress & Submit Work
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>Current Progress: <strong style={{ color: '#818cf8' }}>{currentProgress}%</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Drag slider to adjust</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentProgress}
                    onChange={(e) => setCurrentProgress(parseInt(e.target.value, 10))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleProgressChange}
                    loading={updatingProgress}
                  >
                    Save Progress ({currentProgress}%)
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={() => setIsSubmitModalOpen(true)}
                  >
                    {assignment.submissions?.length > 0 ? 'Submit Revision' : 'Submit Completed Work'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviewer Action Bar */}
          {canReview && (
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-lg)',
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h4 style={{ color: '#c4b5fd', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Review Decision Required
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  This task has been submitted and is currently in your review queue.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant="warning"
                  onClick={() => setIsReworkModalOpen(true)}
                >
                  Request Rework
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle}
                  onClick={() => setIsApproveModalOpen(true)}
                >
                  Approve Submission
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Right Column: Assignee & Deadline Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Candidate Assignee">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {assignment.candidate?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <Link
                  to={`/candidates/${assignment.candidate?._id}`}
                  style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}
                >
                  {assignment.candidate?.name}
                </Link>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {assignment.candidate?.email}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.825rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Team:</span>
                <span style={{ fontWeight: 600 }}>{assignment.candidate?.team}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                <span style={{ fontWeight: 600 }}>{assignment.candidate?.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                <span style={{ fontWeight: 600 }}>{assignment.candidate?.designation}</span>
              </div>
            </div>
          </Card>

          <Card title="Deadline & Timeliness">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calendar size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Deadline</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {assignment.isOverdue && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--danger-light)',
                    border: '1px solid var(--danger-border)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>This task has passed its target deadline</span>
                </div>
              )}

              {assignment.completedAt && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Completed on: <strong>{new Date(assignment.completedAt).toLocaleDateString()}</strong>
                </div>
              )}

              <div style={{ marginTop: '0.5rem' }}>
                <ProgressBar percentage={assignment.progressPercentage || 0} height={8} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submissions & Review History Timeline */}
      <Card
        title={`Submission & Review History (${assignment.submissions?.length || 0})`}
        subtitle="Versioned submissions, candidate attachments, and reviewer feedback audit trail"
      >
        {(!assignment.submissions || assignment.submissions.length === 0) ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No submissions recorded yet for this task.
          </div>
        ) : (
          <div className="timeline">
            {assignment.submissions.map((sub, idx) => (
              <div
                key={sub._id}
                className={`timeline-item ${
                  sub.status === 'APPROVED' ? 'success' : sub.status === 'REWORK_REQUIRED' ? 'warning' : ''
                }`}
              >
                <div className="timeline-marker" />
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        Version {sub.version}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Submitted on: {new Date(sub.submittedAt).toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '0.75rem',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {sub.submissionText}
                  </div>

                  {sub.attachmentUrl && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <a
                        href={sub.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          color: '#818cf8',
                          backgroundColor: 'var(--primary-light)',
                          padding: '0.3rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>{sub.attachmentUrl}</span>
                      </a>
                    </div>
                  )}

                  {/* Attached Reviews */}
                  {sub.reviews && sub.reviews.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      {sub.reviews.map((rev) => (
                        <div
                          key={rev._id}
                          style={{
                            backgroundColor:
                              rev.decision === 'APPROVED'
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'rgba(245, 158, 11, 0.08)',
                            borderLeft: `3px solid ${
                              rev.decision === 'APPROVED' ? 'var(--success)' : 'var(--warning)'
                            }`,
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: rev.decision === 'APPROVED' ? '#6ee7b7' : '#fcd34d',
                              marginBottom: '0.2rem',
                            }}
                          >
                            <span>Review Decision: {rev.decision}</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {new Date(rev.reviewedAt).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                            {rev.comments}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Reviewed by: {rev.reviewer?.name || 'Reviewer'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Submit Work Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Work for Review"
        subtitle={`Submission Version: ${(assignment.submissions?.length || 0) + 1}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitWork} loading={submitting}>
              Submit for Review
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitWork}>
          <div className="form-group">
            <label className="form-label">
              Submission Description / Summary <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Describe what was accomplished, how to test, and key deliverables..."
              required
            />
          </div>
          <Input
            label="Attachment / Repository / Demo URL"
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="https://github.com/organization/repo-pull/12"
          />
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Submission"
        subtitle="This will mark the task as COMPLETED and approve the submission"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsApproveModalOpen(false)}
              disabled={reviewing}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove} loading={reviewing}>
              Confirm Approval
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Review Comments / Commendation</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Provide constructive commendation and notes for the candidate..."
          />
        </div>
      </Modal>

      {/* Request Rework Modal */}
      <Modal
        isOpen={isReworkModalOpen}
        onClose={() => setIsReworkModalOpen(false)}
        title="Request Rework"
        subtitle="This will set the task back to REWORK REQUIRED for the candidate"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsReworkModalOpen(false)}
              disabled={reviewing}
            >
              Cancel
            </Button>
            <Button variant="warning" onClick={handleRequestRework} loading={reviewing}>
              Send Rework Feedback
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">
            Feedback & Rework Instructions <span className="required">*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={4}
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder="Specifically describe what needs to be improved, fixed, or re-tested..."
            required
          />
        </div>
      </Modal>
    </div>
  );
};