import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Download, ArrowLeft, Search, Eye } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { Badge } from '../../components/common/Badge/Badge';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Table, SearchBar, LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const CandidateReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getCandidateReports({
        search,
        team: selectedTeam,
      });
      setReport(res.data?.report || []);
    } catch (err) {
      console.error('Failed to load candidate reports:', err);
      setError(err.message || 'Failed to load candidate performance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedTeam]);

  const handleExportCSV = () => {
    if (!report || report.length === 0) return;

    const headers = [
      'Candidate Name',
      'Email',
      'Team',
      'Department',
      'Designation',
      'Total Assigned',
      'Completed',
      'Pending',
      'In Progress',
      'Overdue',
      'Completion %',
      'On-Time %',
      'Rework Count',
    ];

    const rows = report.map((r) => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.team}"`,
      `"${r.department}"`,
      `"${r.designation}"`,
      r.totalAssigned,
      r.completed,
      r.pending,
      r.inProgress,
      r.overdue,
      `${r.completionPercentage}%`,
      `${r.onTimePercentage}%`,
      r.reworkCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `candidate_performance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Candidate Name',
      key: 'name',
      render: (row) => (
        <div>
          <Link to={`/candidates/${row._id}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {row.name}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.designation}</div>
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
      key: 'totalAssigned',
      render: (row) => <strong>{row.totalAssigned}</strong>,
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
      header: 'Completion Rate',
      key: 'completionPercentage',
      render: (row) => (
        <div style={{ minWidth: '120px' }}>
          <ProgressBar percentage={row.completionPercentage || 0} height={6} />
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
    {
      header: 'Reworks Triggered',
      key: 'reworkCount',
      render: (row) => (
        row.reworkCount > 0 ? (
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{row.reworkCount}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>0</span>
        )
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="page-header-responsive">
        <div>
          <h2>Candidate Performance Evaluation</h2>
          <p>Detailed performance matrix covering completion rates, on-time percentage, and rework cycles</p>
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

      <div className="filter-bar">
        <div className="filter-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Filter candidates by name, email, department..."
          />
        </div>
      </div>

      <Card noPadding>
        {loading ? (
          <LoadingSpinner text="Compiling candidate performance metrics..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReport} />
        ) : (
          <Table
            columns={columns}
            data={report}
            emptyMessage="No candidate performance records found"
          />
        )}
      </Card>
    </div>
  );
};