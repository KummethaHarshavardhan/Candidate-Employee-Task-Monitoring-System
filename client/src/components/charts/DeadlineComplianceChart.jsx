import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const DeadlineComplianceChart = ({ deadlineStats = {} }) => {
  const chartData = [
    { name: 'On Time', count: deadlineStats.completedOnTime || 0, fill: '#10b981' },
    { name: 'Completed Late', count: deadlineStats.completedLate || 0, fill: '#f59e0b' },
    { name: 'Overdue', count: deadlineStats.overdue || 0, fill: '#ef4444' },
    { name: 'Due Today', count: deadlineStats.dueToday || 0, fill: '#3b82f6' },
    { name: 'Upcoming', count: deadlineStats.upcoming || 0, fill: '#64748b' },
  ];

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.75rem',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ fontWeight: 700, color: data.fill }}>{data.name}</div>
          <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
            Tasks: <strong>{data.count}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip content={customTooltip} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};