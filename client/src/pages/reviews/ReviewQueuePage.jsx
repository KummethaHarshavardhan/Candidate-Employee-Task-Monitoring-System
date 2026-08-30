import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge/PriorityBadge';
import { Badge } from '../../components/common/Badge/Badge';
import { Modal } from '../../components/common/Modal/Modal';
import { Table, SearchBar, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const ReviewQueuePage = () => {
  const { role } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Modals state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reviewService.getReviewQueue({
        search,
        team: selectedTeam,
        priority: selectedPriority,
      });
      setQueue(res.data?.queue || []);
    } catch (err) {
      console.error('Failed to load review queue:', err);
      setError(err.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueue();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedTeam, selectedPriority]);

  const handleOpenApprove = (sub) => {
    setSelectedSubmission(sub);
    setComments('Submission meets all requirements and deliverables. Approved.');
    setIsApproveModalOpen(true);
  };

  const handleOpenRework = (sub) => {
    setSelectedSubmission(sub);
    setComments('');
    setIsReworkModalOpen(true);
  };

  const handleApprove = async () => {
    try {
      setSubmittingDecision(true);
      await reviewService.approveSubmission(selectedSubmission._id, comments);
      toast.success(
        `Task "${selectedSubmission.taskAssignment?.task?.title}" approved and completed`,
        'Submission Approved'
      );
      setIsApproveModalOpen(false);
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Failed to approve submission', 'Error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleRework = async () => {
    if (!comments.trim()) {
      toast.warning('Please provide feedback comments for the candidate', 'Feedback Required');
      return;
    }

    try {
      setSubmittingDecision(true);
      await reviewService.reworkSubmission(selectedSubmission._id, comments);
      toast.success('Rework requested successfully', 'Rework Cycle Initiated');
      setIsReworkModalOpen(false);
      fetchQueue();
    } catch (err) {
      toast.error(err.message || 'Failed to request rework', 'Error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const columns = [
    {
      header: 'Task Title',
      key: 'task',
      render: (row) => (
        <div>
          <Link
            to={`/tasks/${row.taskAssignment?._id}`}
            style={{ fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {row.taskAssignment?.task?.title || 'Untitled Task'}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Submission Version: {row.version}
          </div>
        </div>
      ),
    },
    {
      header: 'Candidate / Team',
      key: 'candidate',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.candidate?.name}</div>
          <Badge variant="primary" style={{ marginTop: '2px' }}>
            {row.candidate?.team || 'Team'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (row) => <PriorityBadge priority={row.taskAssignment?.task?.priority} />,
    },
    {
      header: 'Submission Notes',
      key: 'submissionText',
      render: (row) => (
        <div
          style={{
            maxWidth: '240px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--text-secondary)',
          }}
          title={row.submissionText}
        >
          {row.submissionText}
        </div>
      ),
    },
    {
      header: 'Deliverable Link',
      key: 'attachmentUrl',
      render: (row) => (
        row.attachmentUrl ? (
          <a
            href={row.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: '#818cf8',
              fontSize: '0.8rem',
            }}
          >
            <ExternalLink size={13} />
            <span>Open Link</span>
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
        )
      ),
    },
    {
      header: 'Submitted Time',
      key: 'submittedAt',
      render: (row) => (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {new Date(row.submittedAt).toLocaleDateString()} {new Date(row.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      ),
    },
    {
      header: 'Review Decisions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Button
            variant="success"
            size="sm"
            onClick={() => handleOpenApprove(row)}
            title="Approve Submission"
          >
            <CheckCircle size={14} /> Approve
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={() => handleOpenRework(row)}
            title="Request Rework"
          >
            <AlertTriangle size={14} /> Rework
          </Button>
          <Link to={`/tasks/${row.taskAssignment?._id}`}>
            <Button variant="secondary" size="sm" title="View Details">
              <Eye size={14} />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="page-header-responsive">
        <div>
          <h2>Reviewer Queue</h2>
          <p>Pending candidate submissions awaiting code review, approval, or rework requests</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchQueue}>
          Refresh Queue
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search pending reviews by task, candidate name..."
          />
          <select
            className="form-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>
      </div>

      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Loading reviewer queue..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchQueue} />
        ) : (
          <Table
            columns={columns}
            data={queue}
            emptyMessage="Review Queue is Empty"
            emptySubtext="All submitted tasks have been reviewed and processed."
          />
        )}
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Candidate Submission"
        subtitle={`Task: "${selectedSubmission?.taskAssignment?.task?.title}" — Candidate: ${selectedSubmission?.candidate?.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsApproveModalOpen(false)}
              disabled={submittingDecision}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove} loading={submittingDecision}>
              Confirm Approval (Complete Task)
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Review Comments / Commendation</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Notes on code quality, testing rigor, and implementation..."
          />
        </div>
      </Modal>

      {/* Request Rework Modal */}
      <Modal
        isOpen={isReworkModalOpen}
        onClose={() => setIsReworkModalOpen(false)}
        title="Request Candidate Rework"
        subtitle={`Task: "${selectedSubmission?.taskAssignment?.task?.title}" — Candidate: ${selectedSubmission?.candidate?.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsReworkModalOpen(false)}
              disabled={submittingDecision}
            >
              Cancel
            </Button>
            <Button variant="warning" onClick={handleRework} loading={submittingDecision}>
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
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Explain specifically what needs improvement, edge cases, or bug fixes..."
            required
          />
        </div>
      </Modal>
    </div>
  );
};