import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Eye, ExternalLink, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { Badge } from '../../components/common/Badge/Badge';
import { Table, Pagination, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const SubmissionListPage = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await submissionService.getSubmissions({ page, limit: 10 });
      setSubmissions(res.data?.submissions || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(1);
  }, []);

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
            {row.taskAssignment?.task?.title || 'Task Details'}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Version {row.version}
          </div>
        </div>
      ),
    },
    {
      header: 'Submitted By',
      key: 'candidate',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.candidate?.name || 'Candidate'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row.candidate?.team || 'Team'}
          </div>
        </div>
      ),
    },
    {
      header: 'Submission Notes',
      key: 'submissionText',
      render: (row) => (
        <div
          style={{
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--text-secondary)',
          }}
        >
          {row.submissionText}
        </div>
      ),
    },
    {
      header: 'Attachment',
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
            <span>View Link</span>
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
        )
      ),
    },
    {
      header: 'Submission Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Submitted At',
      key: 'submittedAt',
      render: (row) => (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {new Date(row.submittedAt).toLocaleDateString()} {new Date(row.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Link to={`/tasks/${row.taskAssignment?._id}`}>
          <Button variant="secondary" size="sm" icon={Eye}>
            View Task
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Work Submissions</h2>
          <p>Complete audit history of candidate task submissions, versions, and attachments</p>
        </div>
        <Link to="/tasks">
          <Button variant="primary" icon={Send}>
            Submit Work on Assigned Task
          </Button>
        </Link>
      </div>

      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Fetching submissions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchSubmissions(pagination.page)} />
        ) : (
          <>
            <Table
              columns={columns}
              data={submissions}
              emptyMessage="No submissions recorded"
            />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={(p) => fetchSubmissions(p)}
            />
          </>
        )}
      </Card>
    </div>
  );
};