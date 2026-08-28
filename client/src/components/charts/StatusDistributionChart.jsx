import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const StatusDistributionChart = ({ data = [] }) => {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No task data available</p>
      </div>
    );
  }

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
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
          <div style={{ color: item.payload.color || '#fff', fontWeight: 700 }}>{item.name}</div>
          <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
            Count: <strong>{item.value}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#4f46e5'} stroke="var(--bg-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};