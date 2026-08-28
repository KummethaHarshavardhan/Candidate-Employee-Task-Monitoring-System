import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckSquare,
  Search,
  Filter,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Table, Pagination, SearchBar, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';
import { Badge } from '../../components/common/Badge/Badge';
import { Modal } from '../../components/common/Modal/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog/ConfirmDialog';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';

export const CandidateListPage = () => {
  const { role } = useAuth();
  const toast = useToast();
  const isAdmin = role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [filterMeta, setFilterMeta] = useState({ teams: [], departments: [] });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Candidate Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    team: '',
    status: 'ACTIVE',
  });

  // Assign Task Form Data
  const [assignData, setAssignData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: '',
    notes: '',
  });

  const fetchFilterMeta = async () => {
    try {
      const res = await candidateService.getFiltersMeta();
      setFilterMeta(res.data || { teams: [], departments: [] });
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const fetchCandidates = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await candidateService.getCandidates({
        page,
        limit: 10,
        search,
        team: selectedTeam,
        department: selectedDept,
      });

      setCandidates(res.data?.candidates || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError(err.message || 'Failed to fetch candidates list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterMeta();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedTeam, selectedDept]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: filterMeta.departments[0] || 'Engineering',
      designation: '',
      team: filterMeta.teams[0] || 'Team Alpha',
      status: 'ACTIVE',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (cand) => {
    setSelectedCandidate(cand);
    setFormData({
      name: cand.name,
      email: cand.email,
      phone: cand.phone || '',
      department: cand.department,
      designation: cand.designation,
      team: cand.team,
      status: cand.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (cand) => {
    setSelectedCandidate(cand);
    setIsDeleteModalOpen(true);
  };

  const handleOpenAssign = (cand) => {
    setSelectedCandidate(cand);
    // default deadline to 5 days in future
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

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await candidateService.createCandidate(formData);
      toast.success('Candidate profile created successfully', 'Candidate Added');
      setIsCreateModalOpen(false);
      fetchCandidates(pagination.page);
      fetchFilterMeta();
    } catch (err) {
      toast.error(err.message || 'Failed to create candidate', 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await candidateService.updateCandidate(selectedCandidate._id, formData);
      toast.success('Candidate profile updated successfully', 'Changes Saved');
      setIsEditModalOpen(false);
      fetchCandidates(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to update candidate', 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCandidate = async () => {
    try {
      setFormLoading(true);
      await candidateService.deleteCandidate(selectedCandidate._id);
      toast.success('Candidate deleted successfully', 'Deleted');
      setIsDeleteModalOpen(false);
      fetchCandidates(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete candidate', 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignData.title || !assignData.deadline) {
      toast.warning('Please provide a task title and deadline', 'Missing Fields');
      return;
    }

    try {
      setFormLoading(true);
      await taskService.createTask({
        title: assignData.title,
        description: assignData.description,
        priority: assignData.priority,
        candidateId: selectedCandidate._id,
        deadline: assignData.deadline,
        notes: assignData.notes,
      });

      toast.success(
        `Task assigned to ${selectedCandidate.name} successfully`,
        'Task Allocated'
      );
      setIsAssignModalOpen(false);
      fetchCandidates(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to assign task', 'Assignment Error');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Candidate Name',
      key: 'name',
      render: (row) => (
        <div>
          <Link
            to={`/candidates/${row._id}`}
            style={{ fontWeight: 700, color: 'var(--text-primary)' }}
          >
            {row.name}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Department / Role',
      key: 'department',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.department}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.designation}</div>
        </div>
      ),
    },
    {
      header: 'Team',
      key: 'team',
      render: (row) => <Badge variant="primary">{row.team}</Badge>,
    },
    {
      header: 'Task Summary',
      key: 'taskStats',
      render: (row) => {
        const stats = row.taskStats || {};
        return (
          <div style={{ minWidth: '140px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.775rem',
                marginBottom: '0.25rem',
              }}
            >
              <span>{stats.completedTasks || 0} / {stats.totalTasks || 0} Done</span>
              {stats.overdueTasks > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {stats.overdueTasks} Overdue
                </span>
              )}
            </div>
            <ProgressBar percentage={stats.completionRate || 0} showLabel={false} height={6} />
          </div>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>
          {row.status || 'ACTIVE'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Link to={`/candidates/${row._id}`} title="View Details">
            <Button variant="secondary" size="sm">
              <Eye size={14} />
            </Button>
          </Link>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleOpenAssign(row)}
            title="Assign Task"
          >
            <CheckSquare size={14} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            title="Edit Candidate"
          >
            <Edit2 size={14} />
          </Button>
          {isAdmin && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleOpenDelete(row)}
              title="Delete Candidate"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h2>Candidate & Employee Directory</h2>
          <p>Manage candidate profiles, view department assignments, and allocate tasks</p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Add New Candidate
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search candidates by name, email, role..."
          />
          <select
            className="form-select"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">All Teams</option>
            {filterMeta.teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">All Departments</option>
            {filterMeta.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Fetching candidate directory..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchCandidates(pagination.page)} />
        ) : (
          <>
            <Table
              columns={columns}
              data={candidates}
              emptyMessage="No candidates match your search filters"
            />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={(p) => fetchCandidates(p)}
            />
          </>
        )}
      </Card>

      {/* Create Candidate Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Candidate"
        subtitle="Register candidate into the enterprise monitoring system"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateCandidate} loading={formLoading}>
              Create Candidate
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCandidate}>
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Jane Doe"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="candidate@company.com"
            required
          />
          <div className="grid grid-2 gap-4">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 555-0123"
            />
            <Input
              label="Designation / Role"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. React Frontend Intern"
              required
            />
          </div>
          <div className="grid grid-2 gap-4">
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. Frontend Engineering"
              required
            />
            <Input
              label="Team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              placeholder="e.g. Team Alpha"
              required
            />
          </div>
          <Input
            label="Portal Login Password (Optional)"
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Set candidate's initial login password (min 6 chars)"
          />
        </form>
      </Modal>

      {/* Edit Candidate Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Candidate Details"
        subtitle={`Updating information for ${selectedCandidate?.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateCandidate} loading={formLoading}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCandidate}>
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <div className="grid grid-2 gap-4">
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
            <Input
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-2 gap-4">
            <Input
              label="Team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              required
            />
            <Select
              label="Candidate Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
              ]}
            />
          </div>
          <Input
            label="Reset Portal Password (Optional)"
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter new password to update login credentials"
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCandidate}
        title="Delete Candidate"
        message={`Are you sure you want to delete candidate ${selectedCandidate?.name}? All associated task assignments will also be deleted.`}
        confirmText="Delete Candidate"
        confirmVariant="danger"
        loading={formLoading}
      />

      {/* Quick Task Assign Modal for Candidate */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Allocate Task to Candidate"
        subtitle={`Assigning new task directly to ${selectedCandidate?.name} (${selectedCandidate?.team})`}
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
              Confirm Task Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignTask}>
          <Input
            label="Task Title"
            value={assignData.title}
            onChange={(e) => setAssignData({ ...assignData, title: e.target.value })}
            placeholder="e.g. Build Payment Gateway Webhook Integration"
            required
          />
          <div className="form-group">
            <label className="form-label">
              Task Description <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={assignData.description}
              onChange={(e) => setAssignData({ ...assignData, description: e.target.value })}
              placeholder="Detailed instructions, requirements, and acceptance criteria..."
              required
            />
          </div>
          <div className="grid grid-2 gap-4">
            <Select
              label="Priority Level"
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
            label="Assignment Notes (Optional)"
            value={assignData.notes}
            onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
            placeholder="e.g. Refer to repo wiki for setup instructions."
          />
        </form>
      </Modal>
    </div>
  );
};