import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckSquare, ArrowLeft, Send } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { candidateService } from '../../services/candidateService';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { Select } from '../../components/common/Select/Select';
import '../../components/common/Textarea/Textarea.css';

export const CreateTaskPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCandidates, setFetchingCandidates] = useState(true);

  // Form State
  const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    candidateId: '',
    deadline: defaultDeadline,
    notes: '',
  });

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setFetchingCandidates(true);
        const res = await candidateService.getCandidates({ limit: 500 });
        setCandidates(res.data?.candidates || []);
      } catch (err) {
        console.error('Failed to load candidates:', err);
        toast.error('Failed to load candidate list', 'Error');
      } finally {
        setFetchingCandidates(false);
      }
    };

    fetchCandidates();
  }, []);

  const isAllSelected = formData.candidateId === 'ALL';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.warning('Please enter title and description', 'Missing fields');
      return;
    }
    if (!formData.candidateId) {
      toast.warning('Please select who to assign this task to', 'Missing fields');
      return;
    }

    try {
      setLoading(true);

      if (isAllSelected) {
        const { candidateId, ...rest } = formData;
        const payload = { ...rest, candidateIds: candidates.map((c) => c._id) };
        await taskService.createTask(payload);
        toast.success(
          `Task created and allocated to all ${candidates.length} employees`,
          'Task Allocated'
        );
      } else {
        await taskService.createTask(formData);
        toast.success('Task created and assigned successfully', 'Task Allocated');
      }

      navigate('/tasks');
    } catch (err) {
      toast.error(err.message || 'Failed to create task', 'Creation Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="page-header-responsive">
        <div>
          <h2>Create & Allocate Task</h2>
          <p>Create a centralized task and assign it to a candidate with priority & deadline</p>
        </div>
        <Link to="/tasks">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Task List
          </Button>
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Implement OAuth2 Social Login and Session Store"
            required
          />

          <div className="form-group">
            <label className="form-label">
              Detailed Description & Acceptance Criteria <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline specific objectives, architectural requirements, and test scenarios..."
              required
            />
          </div>

          <div className="grid grid-2 gap-4">
            <Select
              label="Priority Level"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'LOW', label: 'LOW - General maintenance or cleanup' },
                { value: 'MEDIUM', label: 'MEDIUM - Standard milestone feature' },
                { value: 'HIGH', label: 'HIGH - Urgent sprint deliverable' },
                { value: 'URGENT', label: 'URGENT - Critical blocker or release fix' },
              ]}
              required
            />

            <Input
              label="Task Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Assign to Employee (by Email) <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={formData.candidateId}
              onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
              disabled={fetchingCandidates}
              required
            >
              <option value="">
                {fetchingCandidates ? 'Loading employees...' : 'Select an employee by email'}
              </option>
              {!fetchingCandidates && candidates.length > 0 && (
                <option value="ALL">
                  ★ All Employees — Send this task to everyone ({candidates.length})
                </option>
              )}
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.email} — {c.name} ({c.team} • {c.designation})
                </option>
              ))}
            </select>
            {isAllSelected && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                This task will be created and assigned individually to all {candidates.length} employees, each with their own progress tracking.
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Assignment Notes / References (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add links to documentation, API blueprints, or repository branches..."
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Link to="/tasks">
              <Button variant="secondary" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" icon={Send} loading={loading}>
              Create & Allocate Task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};