import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  CheckSquare,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { StatusDistributionChart } from '../../components/charts/StatusDistributionChart';
import { TeamPerformanceChart } from '../../components/charts/TeamPerformanceChart';
import { DeadlineComplianceChart } from '../../components/charts/DeadlineComplianceChart';
import { LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const ReportsOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [teams, setTeams] = useState([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, teamsRes] = await Promise.all([
        reportService.getOverview(),
        reportService.getTeamReports(),
      ]);

      setOverview(overviewRes.data);
      setTeams(teamsRes.data?.report || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setError(err.message || 'Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <LoadingSpinner size={40} text="Compiling analytical summaries & statistics..." />;
  }

  if (error) {
    return <ErrorState title="Report Error" message={error} onRetry={fetchReports} />;
  }

  const kpi = overview?.kpi || {};
  const statusDistribution = overview?.statusDistribution || [];
  const deadlineStats = overview?.deadlineStats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Evaluation & Performance Reports</h2>
          <p>Holistic reporting across candidate velocity, team health, and task completion metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/reports/candidates">
            <Button variant="secondary" icon={Users}>
              Candidate Report
            </Button>
          </Link>
          <Link to="/reports/teams">
            <Button variant="secondary" icon={Layers}>
              Team Report
            </Button>
          </Link>
          <Link to="/reports/tasks">
            <Button variant="primary" icon={FileSpreadsheet}>
              Task-Wise Audit Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">Completion Efficiency</div>
            <div className="stat-value">{kpi.completionRate || 0}%</div>
            <div className="stat-trend" style={{ color: '#34d399' }}>
              {kpi.completedTasks || 0} of {kpi.totalAssignments || 0} tasks
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-label">On-Time Completion</div>
            <div className="stat-value">{kpi.onTimeRate || 0}%</div>
            <div className="stat-trend" style={{ color: '#818cf8' }}>
              Met target deadline
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="stat-label">Overdue Ratio</div>
            <div className="stat-value" style={{ color: '#f87171' }}>{kpi.overdueTasks || 0}</div>
            <div className="stat-trend" style={{ color: '#f87171' }}>
              Active delayed tasks
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Active Reworks</div>
            <div className="stat-value">{kpi.reworkTasks || 0}</div>
            <div className="stat-trend" style={{ color: '#fbbf24' }}>
              Revision cycle
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-3 gap-6">
        <Card title="Task Status Breakdown" subtitle="Distribution of all lifecycle stages">
          <StatusDistributionChart data={statusDistribution} />
        </Card>

        <Card title="Team Comparative Velocity" subtitle="Task workload and completions">
          <TeamPerformanceChart data={teams} />
        </Card>

        <Card title="Deadline Timeliness" subtitle="On-time vs delayed tasks">
          <DeadlineComplianceChart deadlineStats={deadlineStats} />
        </Card>
      </div>

      {/* Report Navigation Cards */}
      <div className="grid grid-3 gap-6">
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontWeight: 700 }}>
              <Users size={20} />
              <h3 style={{ fontSize: '1.1rem' }}>Candidate Performance</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Individual candidate task load, completion rate, rework occurrences, and on-time percentages.
            </p>
            <Link to="/reports/candidates" style={{ marginTop: '0.5rem' }}>
              <Button variant="secondary" size="sm" icon={ArrowRight}>
                View Candidate Metrics
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
              <Layers size={20} />
              <h3 style={{ fontSize: '1.1rem' }}>Team Performance</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Cross-team velocity comparison, average completion percentage, and overdue task count.
            </p>
            <Link to="/reports/teams" style={{ marginTop: '0.5rem' }}>
              <Button variant="secondary" size="sm" icon={ArrowRight}>
                View Team Analytics
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c4b5fd', fontWeight: 700 }}>
              <FileSpreadsheet size={20} />
              <h3 style={{ fontSize: '1.1rem' }}>Task-Wise Detailed Log</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Comprehensive auditable log with candidates, priorities, deadlines, submission timestamps, and reviews.
            </p>
            <Link to="/reports/tasks" style={{ marginTop: '0.5rem' }}>
              <Button variant="secondary" size="sm" icon={ArrowRight}>
                View Task Log
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};