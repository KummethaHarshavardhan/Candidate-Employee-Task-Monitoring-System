import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Download, ArrowLeft } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Badge } from '../../components/common/Badge/Badge';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Table, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const TeamReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamReport, setTeamReport] = useState([]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getTeamReports();
      setTeamReport(res.data?.report || []);
    } catch (err) {
      console.error('Failed to load team reports:', err);
      setError(err.message || 'Failed to load team analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    if (!teamReport || teamReport.length === 0) return;

    const headers = [
      'Team Name',
      'Total Candidates',
      'Total Tasks',
      'Completed',
      'Pending',
      'In Progress',
      'Overdue',
      'Avg Completion %',
      'On-Time %',
    ];

    const rows = teamReport.map((t) => [
      `"${t.team}"`,
      t.totalCandidates,
      t.totalTasks,
      t.completed,
      t.pending,
      t.inProgress,
      t.overdue,
      `${t.averageCompletionPercentage}%`,
      `${t.onTimePercentage}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `team_performance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Team Name',
      key: 'team',
      render: (row) => <strong style={{ fontSize: '0.95rem' }}>{row.team}</strong>,
    },
    {
      header: 'Candidate Count',
      key: 'totalCandidates',
      render: (row) => <span>{row.totalCandidates} members</span>,
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
      header: 'In Progress',
      key: 'inProgress',
      render: (row) => <span>{row.inProgress}</span>,
    },
    {
      header: 'Overdue',
      key: 'overdue',
      render: (row) => (
        row.overdue > 0 ? (
          <span style={{ color: '#f87171', fontWeight: 700 }}>{row.overdue}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>0</span>
        )
      ),
    },
    {
      header: 'Avg Completion Rate',
      key: 'averageCompletionPercentage',
      render: (row) => (
        <div style={{ minWidth: '130px' }}>
          <ProgressBar percentage={row.averageCompletionPercentage || 0} height={6} />
        </div>
      ),
    },
    {
      header: 'On-Time Rate',
      key: 'onTimePercentage',
      render: (row) => (
        <span style={{ fontWeight: 600, color: row.onTimePercentage >= 80 ? 'var(--success)' : '#f59e0b' }}>
          {row.onTimePercentage}%
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="page-header-responsive">
        <div>
          <h2>Team Performance Evaluation</h2>
          <p>Comparative team performance benchmarks, average completion velocities, and overdue metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Compiling team analytics..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReport} />
        ) : (
          <Table
            columns={columns}
            data={teamReport}
            emptyMessage="No team performance data available"
          />
        )}
      </Card>
    </div>
  );
};