import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const TeamPerformanceChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No team metrics available</p>
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.85rem',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {label}
          </div>
          {payload.map((p, idx) => (
            <div key={idx} style={{ color: p.color, fontSize: '0.775rem' }}>
              {p.name}: <strong>{p.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="team"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip content={customTooltip} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>}
          />
          <Bar dataKey="totalTasks" name="Total Tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};