import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Download, ArrowLeft, Eye, ExternalLink } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge/PriorityBadge';
import { Badge } from '../../components/common/Badge/Badge';
import { Table, SearchBar, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const TaskReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskReports, setTaskReports] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isOverdueOnly, setIsOverdueOnly] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getTaskReports({
        search,
        status: selectedStatus,
        priority: selectedPriority,
        team: selectedTeam,
        isOverdue: isOverdueOnly,
      });
      setTaskReports(res.data?.report || []);
    } catch (err) {
      console.error('Failed to load task reports:', err);
      setError(err.message || 'Failed to load task audit report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedPriority, selectedTeam, isOverdueOnly]);

  const handleExportCSV = () => {
    if (!taskReports || taskReports.length === 0) return;

    const headers = [
      'Task Title',
      'Priority',
      'Candidate Name',
      'Team',
      'Department',
      'Workflow Status',
      'Progress %',
      'Assigned Date',
      'Deadline',
      'Completed Date',
      'Is Overdue',
      'Submission Count',
      'Latest Review Decision',
      'Reviewer Comments',
    ];

    const rows = taskReports.map((r) => [
      `"${r.taskTitle}"`,
      r.priority,
      `"${r.candidateName}"`,
      `"${r.candidateTeam}"`,
      `"${r.candidateDepartment}"`,
      r.status,
      `${r.progressPercentage}%`,
      r.assignedAt ? new Date(r.assignedAt).toLocaleDateString() : 'N/A',
      r.deadline ? new Date(r.deadline).toLocaleDateString() : 'N/A',
      r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'N/A',
      r.isOverdue ? 'YES' : 'NO',
      r.submissionCount,
      r.latestReviewDecision,
      `"${(r.latestReviewComments || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `task_wise_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Task Title',
      key: 'taskTitle',
      render: (row) => (
        <div>
          <Link to={`/tasks/${row.assignmentId}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {row.taskTitle}
          </Link>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              maxWidth: '260px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.taskDescription}
          </div>
        </div>
      ),
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      header: 'Candidate / Team',
      key: 'candidateName',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.candidateName}</div>
          <Badge variant="primary" style={{ marginTop: '2px' }}>{row.candidateTeam}</Badge>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} isOverdue={row.isOverdue} />,
    },
    {
      header: 'Progress',
      key: 'progressPercentage',
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>{row.progressPercentage}%</span>,
    },
    {
      header: 'Deadline',
      key: 'deadline',
      render: (row) => (
        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          {row.deadline ? new Date(row.deadline).toLocaleDateString() : 'N/A'}
          {row.isOverdue && (
            <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.7rem' }}>
              Overdue
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Submissions',
      key: 'submissionCount',
      render: (row) => (
        <span style={{ fontSize: '0.8rem' }}>
          {row.submissionCount} versions
        </span>
      ),
    },
    {
      header: 'Latest Review',
      key: 'latestReviewDecision',
      render: (row) => (
        row.latestReviewDecision !== 'NONE' ? (
          <Badge variant={row.latestReviewDecision === 'APPROVED' ? 'success' : 'warning'}>
            {row.latestReviewDecision}
          </Badge>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No review yet</span>
        )
      ),
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Link to={`/tasks/${row.assignmentId}`}>
          <Button variant="secondary" size="sm" icon={Eye}>
            Details
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Task-Wise Audit & Reporting Log</h2>
          <p>Comprehensive audit record of all task assignments, deadlines, submissions, and review outcomes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/reports">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Overview
            </Button>
          </Link>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
            Export to CSV
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search task audit logs..."
          />
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
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
            style={{ width: 'auto', minWidth: '140px' }}
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
            <option value="true">Overdue Tasks</option>
          </select>
        </div>
      </div>

      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Generating task-wise audit log..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReports} />
        ) : (
          <Table
            columns={columns}
            data={taskReports}
            emptyMessage="No tasks found matching your filter criteria"
          />
        )}
      </Card>
    </div>
  );
};