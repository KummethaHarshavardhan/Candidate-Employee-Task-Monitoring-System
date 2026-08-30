import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Badge } from '../../components/common/Badge/Badge';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge/PriorityBadge';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Table, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';
import { Modal } from '../../components/common/Modal/Modal';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';

export const CandidateDetailsPage = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const toast = useToast();
  const canAssign = role === 'ADMIN' || role === 'REVIEWER';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [summary, setSummary] = useState({});
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'ACTIVE', 'COMPLETED', 'OVERDUE'

  // Task Assign Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [assignData, setAssignData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: '',
    notes: '',
  });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await candidateService.getCandidateById(id);
      setCandidate(res.data?.candidate);
      setAssignments(res.data?.assignments || []);
      setSummary(res.data?.summary || {});
    } catch (err) {
      console.error('Failed to fetch candidate details:', err);
      setError(err.message || 'Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleOpenAssign = () => {
    const defaultDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    setAssignData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      deadline: defaultDeadline,
      notes: '',
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignData.title || !assignData.deadline) {
      toast.warning('Please enter title and deadline', 'Missing fields');
      return;
    }

    try {
      setFormLoading(true);
      await taskService.createTask({
        title: assignData.title,
        description: assignData.description,
        priority: assignData.priority,
        candidateId: candidate._id,
        deadline: assignData.deadline,
        notes: assignData.notes,
      });

      toast.success(`Task assigned to ${candidate.name}`, 'Success');
      setIsAssignModalOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to allocate task', 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size={40} text="Loading candidate details & task history..." />;
  }

  if (error || !candidate) {
    return <ErrorState title="Candidate Not Found" message={error} onRetry={fetchDetails} />;
  }

  // Filter tasks based on activeTab
  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'ACTIVE') return a.status !== 'COMPLETED';
    if (activeTab === 'COMPLETED') return a.status === 'COMPLETED';
    if (activeTab === 'OVERDUE') return a.isOverdue;
    return true;
  });

  const taskColumns = [
    {
      header: 'Task Title',
      key: 'task',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.task?.title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Assigned on: {new Date(row.assignedAt).toLocaleDateString()}
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
        <div style={{ minWidth: '110px' }}>
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
            {new Date(row.deadline).toLocaleDateString()}
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
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Link to={`/tasks/${row._id}`}>
          <Button variant="secondary" size="sm" icon={Eye}>
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header Navigation */}
      <div className="page-header-responsive">
        <Link to="/candidates">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Candidates
          </Button>
        </Link>
        {canAssign && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAssign}>
            Assign New Task
          </Button>
        )}
      </div>

      {/* Candidate Profile Info Card */}
      <div className="grid grid-3 gap-6">
        <Card className="candidate-main-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {candidate.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{candidate.name}</h2>
                <Badge variant={candidate.status === 'ACTIVE' ? 'success' : 'default'}>
                  {candidate.status}
                </Badge>
                <Badge variant="primary">{candidate.team}</Badge>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {candidate.designation} • {candidate.department}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <span>{candidate.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Phone size={15} color="var(--text-muted)" />
                  <span>{candidate.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Building size={15} color="var(--text-muted)" />
                  <span>{candidate.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={15} color="var(--text-muted)" />
                  <span>Joined {new Date(candidate.joiningDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Candidate Performance Summary Card */}
        <Card title="Candidate Performance">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Task Completion Rate</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {summary.completionRate || 0}%
                </span>
              </div>
              <ProgressBar percentage={summary.completionRate || 0} showLabel={false} height={8} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  {summary.completedTasks || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Completed
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>
                  {summary.overdueTasks || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Overdue
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                  {summary.inProgressTasks || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  In Progress
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                  {summary.reworkTasks || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rework Active
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Candidate Assigned Tasks Section with Filter Tabs */}
      <Card
        title={`Assigned Tasks (${assignments.length})`}
        subtitle="Complete record of tasks assigned to this candidate"
        actions={
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['ALL', 'ACTIVE', 'COMPLETED', 'OVERDUE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: activeTab === tab ? 'var(--primary)' : 'var(--border-subtle)',
                  backgroundColor:
                    activeTab === tab ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === tab ? '#818cf8' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        }
        noPadding
      >
        <Table
          columns={taskColumns}
          data={filteredAssignments}
          emptyMessage={`No ${activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} tasks assigned to this candidate`}
        />
      </Card>

      {/* Task Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign New Task to ${candidate.name}`}
        subtitle={`Candidate will receive this task in their portal under ${candidate.team}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignTask} loading={formLoading}>
              Assign Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignTask}>
          <Input
            label="Task Title"
            value={assignData.title}
            onChange={(e) => setAssignData({ ...assignData, title: e.target.value })}
            placeholder="e.g. Build GraphQL Gateway for Candidate Portal"
            required
          />
          <div className="form-group">
            <label className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={assignData.description}
              onChange={(e) => setAssignData({ ...assignData, description: e.target.value })}
              placeholder="Provide clear technical specifications and deliverables..."
              required
            />
          </div>
          <div className="grid grid-2 gap-4">
            <Select
              label="Priority"
              value={assignData.priority}
              onChange={(e) => setAssignData({ ...assignData, priority: e.target.value })}
              options={[
                { value: 'LOW', label: 'LOW' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'URGENT', label: 'URGENT' },
              ]}
            />
            <Input
              label="Deadline Date"
              type="date"
              value={assignData.deadline}
              onChange={(e) => setAssignData({ ...assignData, deadline: e.target.value })}
              required
            />
          </div>
          <Input
            label="Notes / Resources (Optional)"
            value={assignData.notes}
            onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
            placeholder="e.g. Figma links, API documentation links"
          />
        </form>
      </Modal>
    </div>
  );
};