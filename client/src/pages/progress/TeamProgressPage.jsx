import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { progressService } from '../../services/progressService';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Badge } from '../../components/common/Badge/Badge';
import { LoadingSpinner, ErrorState } from '../../components/common/DataComponents/DataComponents';

export const TeamProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);

  const fetchTeamProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await progressService.getTeamProgress();
      setTeams(res.data?.teams || []);
    } catch (err) {
      console.error('Failed to load team progress:', err);
      setError(err.message || 'Failed to load team progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamProgress();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="page-header-responsive">
        <div>
          <h2>Team-Wise Progress & Velocity</h2>
          <p>Comparative team workloads, completion efficiency, and task health</p>
        </div>
        <Link to="/progress">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Aggregating team metrics..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTeamProgress} />
      ) : (
        <div className="grid grid-2 gap-6">
          {teams.map((t) => (
            <Card key={t.team}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.team}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.candidateCount} active candidates
                  </p>
                </div>
                <Badge variant="primary">{t.totalTasks} Tasks</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Team Completion Rate</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.completionRate || 0}%</span>
                  </div>
                  <ProgressBar percentage={t.completionRate || 0} showLabel={false} height={8} />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(65px, 1fr))',
                    gap: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.1rem' }}>
                      {t.completed}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Completed
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: '1.1rem' }}>
                      {t.inProgress}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      In Prog
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: '1.1rem' }}>
                      {t.submitted}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Submitted
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        color: t.overdue > 0 ? '#f87171' : 'var(--text-muted)',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                      }}
                    >
                      {t.overdue}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Overdue
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};