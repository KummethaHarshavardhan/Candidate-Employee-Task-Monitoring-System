import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Users,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { progressService } from '../../services/progressService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Table, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';
import { Badge } from '../../components/common/Badge/Badge';

export const ProgressDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [candidateProgress, setCandidateProgress] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, candRes] = await Promise.all([
        progressService.getProgressOverview(),
        progressService.getCandidateProgress(),
      ]);

      setProgressData(overviewRes.data);
      setCandidateProgress(candRes.data?.candidates || []);
    } catch (err) {
      console.error('Failed to load progress monitoring data:', err);
      setError(err.message || 'Failed to load progress monitoring');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner size={40} text="Calculating live task progress & deadline metrics..." />;
  }

  if (error) {
    return <ErrorState title="Progress Monitoring Error" message={error} onRetry={fetchData} />;
  }

  const summary = progressData?.summary || {};
  const deadlines = progressData?.deadlines || {};

  const candidateColumns = [
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
      header: 'Team',
      key: 'team',
      render: (row) => <Badge variant="primary">{row.team}</Badge>,
    },
    {
      header: 'Task Breakdown',
      key: 'tasks',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--success)' }}>{row.completed} Comp</span> •
          <span style={{ color: '#60a5fa' }}>{row.inProgress} In-Prog</span> •
          <span style={{ color: '#a78bfa' }}>{row.submitted} Sub</span> •
          <span style={{ color: 'var(--text-muted)' }}>{row.pending} Pend</span>
        </div>
      ),
    },
    {
      header: 'Overdue Alert',
      key: 'overdue',
      render: (row) => (
        row.overdue > 0 ? (
          <span
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          >
            {row.overdue} OVERDUE
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>0 overdue</span>
        )
      ),
    },
    {
      header: 'Overall Progress',
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
            Profile
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Progress Monitoring Dashboard</h2>
          <p>Real-time tracking of candidate workflow states, velocity, and deadline compliance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/progress/teams">
            <Button variant="secondary" icon={Users}>
              Team Progress Breakdown
            </Button>
          </Link>
          <Button variant="primary" icon={RefreshCw} onClick={fetchData}>
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Workflow State Stage Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">Total Allocated</div>
            <div className="stat-value">{summary.totalTasks || 0}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>Tasks assigned</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-label">Pending Start</div>
            <div className="stat-value">{summary.pending || 0}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>Not yet started</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{summary.inProgress || 0}</div>
            <div className="stat-trend" style={{ color: '#60a5fa' }}>Active development</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
            <Send size={24} />
          </div>
          <div>
            <div className="stat-label">Submitted</div>
            <div className="stat-value">{summary.submitted || 0}</div>
            <div className="stat-trend" style={{ color: '#c4b5fd' }}>Awaiting review</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{summary.completed || 0}</div>
            <div className="stat-trend" style={{ color: '#34d399' }}>{summary.completionRate}% rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value" style={{ color: '#f87171' }}>{summary.overdue || 0}</div>
            <div className="stat-trend" style={{ color: '#f87171' }}>Requires attention</div>
          </div>
        </div>
      </div>

      {/* Deadline Monitoring Section */}
      <Card
        title="Deadline & Timeliness Classification"
        subtitle="Automatic calculation based on current time versus task deadline"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #10b981',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Completed On Time
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {deadlines.completedOnTime || 0}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #f59e0b',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Completed Late
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {deadlines.completedLate || 0}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #ef4444',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Currently Overdue
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {deadlines.overdue || 0}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Due Today
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
              {deadlines.dueToday || 0}
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '4px solid #64748b',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Upcoming Future
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
              {deadlines.upcoming || 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Candidate Progress Velocity Table */}
      <Card
        title="Candidate Progress & Workload Velocity"
        subtitle="Individual task load, completion rate, and progress percentages"
        noPadding
      >
        <Table
          columns={candidateColumns}
          data={candidateProgress}
          emptyMessage="No candidate progress records found"
        />
      </Card>
    </div>
  );
};