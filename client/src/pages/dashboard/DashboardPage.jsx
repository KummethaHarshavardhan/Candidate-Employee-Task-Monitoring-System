import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { assignmentService } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusBadge } from '../../components/common/StatusBadge/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge/PriorityBadge';
import { Table } from '../../components/common/Table/Table';
import { StatusDistributionChart } from '../../components/charts/StatusDistributionChart';
import { TeamPerformanceChart } from '../../components/charts/TeamPerformanceChart';
import { DeadlineComplianceChart } from '../../components/charts/DeadlineComplianceChart';
import { LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const DashboardPage = () => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [teamReports, setTeamReports] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, teamsRes, assignmentsRes] = await Promise.all([
        reportService.getOverview(),
        reportService.getTeamReports(),
        assignmentService.getAssignments({ limit: 6 }),
      ]);

      setOverview(overviewRes.data);
      setTeamReports(teamsRes.data?.report || []);
      setRecentAssignments(assignmentsRes.data?.assignments || []);
    } catch (err) {
      console.error('[Dashboard Fetch Error]:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner size={40} text="Loading dashboard metrics & analytics..." />;
  }

  if (error) {
    return <ErrorState title="Dashboard Error" message={error} onRetry={fetchData} />;
  }

  const kpi = overview?.kpi || {};
  const statusDistribution = overview?.statusDistribution || [];
  const deadlineStats = overview?.deadlineStats || {};

  const recentColumns = [
    {
      header: 'Task Title',
      key: 'taskTitle',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.task?.title || 'Untitled Task'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ver: {row.assignmentVersion || 1}
          </div>
        </div>
      ),
    },
    {
      header: 'Candidate / Assignee',
      key: 'candidate',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.candidate?.name || 'Unassigned'}</div>
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
      header: 'Status',
      key: 'status',
      render: (row) => (
        <StatusBadge status={row.status} isOverdue={row.isOverdue} />
      ),
    },
    {
      header: 'Deadline',
      key: 'deadline',
      render: (row) => {
        const d = row.deadline ? new Date(row.deadline).toLocaleDateString() : 'N/A';
        return (
          <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
            {d}
          </div>
        );
      },
    },
    {
      header: 'Action',
      key: 'actions',
      render: (row) => (
        <Link to={`/tasks/${row._id}`}>
          <Button variant="secondary" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Welcome back, {user?.name || 'User'} 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Candidate & Employee Task Monitoring, Workflow Progress, and Review Platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {role !== 'CANDIDATE' && (
            <Link to="/tasks/create">
              <Button variant="primary" icon={CheckSquare}>
                Assign New Task
              </Button>
            </Link>
          )}
          <Link to="/progress">
            <Button variant="secondary" icon={TrendingUp}>
              Live Progress
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="stat-grid">
        {/* Total Candidates / Total Tasks for Candidate */}
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
          >
            {role === 'CANDIDATE' ? <CheckSquare size={24} /> : <Users size={24} />}
          </div>
          <div>
            <div className="stat-label">{role === 'CANDIDATE' ? 'My Total Tasks' : 'Total Candidates'}</div>
            <div className="stat-value">{role === 'CANDIDATE' ? (kpi.totalTasks || 0) : (kpi.totalCandidates || 0)}</div>
            <div className="stat-trend" style={{ color: '#60a5fa' }}>
              {role === 'CANDIDATE' ? 'Assigned to me' : 'Active pool'}
            </div>
          </div>
        </div>

        {/* Active Tasks (In Progress + Submitted) */}
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
          >
            <CheckSquare size={24} />
          </div>
          <div>
            <div className="stat-label">Active Tasks</div>
            <div className="stat-value">{(kpi.inProgressTasks || 0) + (kpi.submittedTasks || 0)}</div>
            <div className="stat-trend" style={{ color: '#818cf8' }}>
              {kpi.inProgressTasks || 0} in progress
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-label">Completed Tasks</div>
            <div className="stat-value">{kpi.completedTasks || 0}</div>
            <div className="stat-trend" style={{ color: '#34d399' }}>
              {kpi.completionRate || 0}% completion rate
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-label">Pending Start</div>
            <div className="stat-value">{kpi.pendingTasks || 0}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {role === 'CANDIDATE' ? 'To begin' : 'Awaiting candidate start'}
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value" style={{ color: '#f87171' }}>
              {kpi.overdueTasks || 0}
            </div>
            <div className="stat-trend" style={{ color: '#f87171' }}>
              Deadline passed
            </div>
          </div>
        </div>

        {/* Awaiting Review / In Review */}
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}
          >
            <ClipboardCheck size={24} />
          </div>
          <div>
            <div className="stat-label">{role === 'CANDIDATE' ? 'Under Review' : 'Awaiting Review'}</div>
            <div className="stat-value">{role === 'CANDIDATE' ? (kpi.submittedTasks || 0) : (kpi.awaitingReviewTasks || 0)}</div>
            <div className="stat-trend" style={{ color: '#a78bfa' }}>
              {role === 'CANDIDATE' ? 'Pending approval' : 'In review queue'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-3 gap-6">
        {/* Status Distribution Donut Chart */}
        <Card
          title="Status Distribution"
          subtitle="Real-time breakdown of all assignments"
          icon={Award}
        >
          <StatusDistributionChart data={statusDistribution} />
        </Card>

        {/* Team Performance Bar Chart */}
        <Card
          title="Team Velocity"
          subtitle="Total vs Completed tasks by team"
          icon={Users}
        >
          <TeamPerformanceChart data={teamReports} />
        </Card>

        {/* Deadline Compliance Chart */}
        <Card
          title="Deadline Compliance"
          subtitle="Timeliness of completions and active items"
          icon={Calendar}
        >
          <DeadlineComplianceChart deadlineStats={deadlineStats} />
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card
        title="Recent Task Assignments & Workflows"
        subtitle="Latest tasks flowing through the candidate monitoring lifecycle"
        actions={
          <Link to="/tasks">
            <Button variant="secondary" size="sm">
              View All Tasks <ArrowRight size={14} />
            </Button>
          </Link>
        }
      >
        <Table
          columns={recentColumns}
          data={recentAssignments}
          emptyMessage="No task assignments found"
        />
      </Card>
    </div>
  );
};