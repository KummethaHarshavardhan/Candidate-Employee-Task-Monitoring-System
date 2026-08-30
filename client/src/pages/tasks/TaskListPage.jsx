import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Eye,
  UserCheck,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { candidateService } from '../../services/candidateService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge/PriorityBadge';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Table, Pagination, SearchBar, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';
import { Modal } from '../../components/common/Modal/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog/ConfirmDialog';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';

export const TaskListPage = () => {
  const { role } = useAuth();
  const toast = useToast();
  const isAdmin = role === 'ADMIN';
  const isReviewer = role === 'REVIEWER';
  const isCandidate = role === 'CANDIDATE';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [candidatesList, setCandidatesList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isOverdueOnly, setIsOverdueOnly] = useState('');

  // Modals state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Edit / Reassign Form states
  const [reassignCandidateId, setReassignCandidateId] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await candidateService.getCandidates({ limit: 100 });
      setCandidatesList(res.data?.candidates || []);
    } catch (err) {
      console.error('Failed to load candidate list:', err);
    }
  };

  const fetchAssignments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await assignmentService.getAssignments({
        page,
        limit: 10,
        search,
        status: selectedStatus,
        priority: selectedPriority,
        team: selectedTeam,
        isOverdue: isOverdueOnly,
      });

      setAssignments(res.data?.assignments || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch task assignments:', err);
      setError(err.message || 'Failed to fetch task assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignments(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedPriority, selectedTeam, isOverdueOnly]);

  const handleOpenReassign = (assignment) => {
    setSelectedAssignment(assignment);
    setReassignCandidateId(assignment.candidate?._id || '');
    setEditDeadline(
      assignment.deadline ? new Date(assignment.deadline).toISOString().split('T')[0] : ''
    );
    setEditNotes(assignment.notes || '');
    setIsReassignModalOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setEditDeadline(
      assignment.deadline ? new Date(assignment.deadline).toISOString().split('T')[0] : ''
    );
    setEditNotes(assignment.notes || '');
    setIsEditModalOpen(true);
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!reassignCandidateId) {
      toast.warning('Please choose a new candidate', 'Candidate Required');
      return;
    }

    try {
      setFormLoading(true);
      await assignmentService.reassignAssignment(selectedAssignment._id, {
        newCandidateId: reassignCandidateId,
        deadline: editDeadline,
        notes: editNotes,
      });

      toast.success('Task reassigned successfully to new candidate', 'Reassigned');
      setIsReassignModalOpen(false);
      fetchAssignments(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to reassign task', 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await assignmentService.updateAssignment(selectedAssignment._id, {
        deadline: editDeadline,
        notes: editNotes,
      });

      toast.success('Task assignment updated successfully', 'Updated');
      setIsEditModalOpen(false);
      fetchAssignments(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update assignment', 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Task Title',
      key: 'task',
      render: (row) => (
        <div>
          <Link
            to={`/tasks/${row._id}`}
            style={{ fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {row.task?.title || 'Untitled Task'}
          </Link>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              maxWidth: '280px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.task?.description}
          </div>
        </div>
      ),
    },
    {
      header: 'Assignee',
      key: 'candidate',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.candidate?.name || 'Unassigned'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row.candidate?.team || 'General'}
          </div>
        </div>
      ),
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (row) => <PriorityBadge priority={row.task?.priority} />,
    },
    {
      header: 'Workflow Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} isOverdue={row.isOverdue} />,
    },
    {
      header: 'Progress',
      key: 'progressPercentage',
      render: (row) => (
        <div style={{ minWidth: '120px' }}>
          <ProgressBar percentage={row.progressPercentage || 0} height={6} />
        </div>
      ),
    },
    {
      header: 'Deadline',
      key: 'deadline',
      render: (row) => (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
            {row.deadline ? new Date(row.deadline).toLocaleDateString() : 'N/A'}
          </div>
          {row.isOverdue && (
            <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>
              Overdue
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Link to={`/tasks/${row._id}`} title="View Details">
            <Button variant="secondary" size="sm">
              <Eye size={14} />
            </Button>
          </Link>
          {(isAdmin || isReviewer) && (
            <>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenReassign(row)}
                title="Reassign to Another Candidate"
              >
                <UserCheck size={14} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEdit(row)}
                title="Edit Assignment Details"
              >
                <Edit2 size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header */}
      <div className="page-header-responsive">
        <div>
          <h2>{isCandidate ? 'My Assigned Tasks' : 'Task Allocation & Management'}</h2>
          <p>Track centralized tasks, candidate allocations, priorities, and deadlines</p>
        </div>
        {!isCandidate && (
          <Link to="/tasks/create">
            <Button variant="primary" icon={Plus}>
              Create & Assign Task
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search tasks, descriptions, candidate names..."
          />
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REWORK_REQUIRED">REWORK REQUIRED</option>
          </select>

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

          <select
            className="form-select"
            value={isOverdueOnly}
            onChange={(e) => setIsOverdueOnly(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="">All Deadlines</option>
            <option value="true">Overdue Tasks Only</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Loading tasks & assignments..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchAssignments(pagination.page)} />
        ) : (
          <>
            <Table
              columns={columns}
              data={assignments}
              emptyMessage="No task assignments found matching your filter criteria"
            />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={(p) => fetchAssignments(p)}
            />
          </>
        )}
      </Card>

      {/* Reassign Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Reassign Task to Another Candidate"
        subtitle={`Task: "${selectedAssignment?.task?.title}" (Version ${selectedAssignment?.assignmentVersion})`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsReassignModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReassign} loading={formLoading}>
              Confirm Reassignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleReassign}>
          <div className="form-group">
            <label className="form-label">
              Select New Assignee <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={reassignCandidateId}
              onChange={(e) => setReassignCandidateId(e.target.value)}
              required
            >
              <option value="">Choose a Candidate</option>
              {candidatesList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.team} • {c.department})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Updated Deadline Date"
            type="date"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            required
          />
          <div className="form-group">
            <label className="form-label">Reassignment Notes / Instructions</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Provide context for why this task is being reassigned..."
            />
          </div>
        </form>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Assignment Details"
        subtitle={`Task: "${selectedAssignment?.task?.title}"`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateAssignment} loading={formLoading}>
              Save Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateAssignment}>
          <Input
            label="Deadline Date"
            type="date"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            required
          />
          <div className="form-group">
            <label className="form-label">Assignment Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Instructions or links for the candidate..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};