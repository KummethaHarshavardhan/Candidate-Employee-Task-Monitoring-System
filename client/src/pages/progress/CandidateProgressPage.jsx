import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ArrowLeft, Eye } from 'lucide-react';
import { progressService } from '../../services/progressService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Table, SearchBar, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';
import { Badge } from '../../components/common/Badge/Badge';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';

export const CandidateProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await progressService.getCandidateProgress();
      setCandidates(res.data?.candidates || []);
    } catch (err) {
      console.error('Failed to load candidate progress list:', err);
      setError(err.message || 'Failed to load progress records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filtered = candidates.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      c.team.toLowerCase().includes(s) ||
      c.department.toLowerCase().includes(s)
    );
  });

  const columns = [
    {
      header: 'Candidate',
      key: 'name',
      render: (row) => (
        <div>
          <Link to={`/candidates/${row._id}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {row.name}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Team / Dept',
      key: 'team',
      render: (row) => (
        <div>
          <Badge variant="primary">{row.team}</Badge>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {row.department}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Tasks',
      key: 'totalTasks',
      render: (row) => <strong>{row.totalTasks}</strong>,
    },
    {
      header: 'Completed',
      key: 'completed',
      render: (row) => (
        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
          {row.completed}
        </span>
      ),
    },
    {
      header: 'Active Tasks',
      key: 'inProgress',
      render: (row) => (
        <span>
          {row.inProgress} In-Prog • {row.submitted} Sub • {row.rework} Rework
        </span>
      ),
    },
    {
      header: 'Overdue',
      key: 'overdue',
      render: (row) => (
        row.overdue > 0 ? (
          <span style={{ color: '#f87171', fontWeight: 700 }}>{row.overdue} OVERDUE</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>0</span>
        )
      ),
    },
    {
      header: 'Progress %',
      key: 'progressPercentage',
      render: (row) => (
        <div style={{ minWidth: '130px' }}>
          <ProgressBar percentage={row.progressPercentage || 0} height={6} />
        </div>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <Link to={`/candidates/${row._id}`}>
          <Button variant="secondary" size="sm" icon={Eye}>
            Details
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Candidate Progress Tracking</h2>
          <p>Individual candidate task metrics, velocity, and completion records</p>
        </div>
        <Link to="/progress">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="filter-bar">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search candidates by name, email, team..."
        />
      </div>

      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Fetching candidate progress records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCandidates} />
        ) : (
          <Table
            columns={columns}
            data={filtered}
            emptyMessage="No candidates match your search"
          />
        )}
      </Card>
    </div>
  );
};