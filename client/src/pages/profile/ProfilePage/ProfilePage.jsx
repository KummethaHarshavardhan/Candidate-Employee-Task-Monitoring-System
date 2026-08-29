import React from 'react';
import { Mail, Shield, Users, Phone, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/common/Card/Card';
import { Badge } from '../../../components/common/Badge/Badge';
import { Button } from '../../../components/common/Button/Button';
import { Input } from '../../../components/common/Input/Input';
import { useToast } from '../../../context/ToastContext';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { user, role, updateProfile } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [phone, setPhone] = React.useState(user?.phone || user?.candidateId?.phone || '');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ phone });
      setEditing(false);
      toast.success('Profile updated successfully', 'Changes Saved');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile', 'Update Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div>
        <h2>User Account Profile</h2>
        <p>Current authentication session and role access privileges</p>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{user?.name}</h2>
              <Badge variant={role === 'ADMIN' ? 'danger' : role === 'REVIEWER' ? 'purple' : 'primary'}>
                {user?.role}
              </Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {user?.email} • {user?.team || 'General Team'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Shield size={14} />
              <span>Assigned Security Role</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>
              {user?.role}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Users size={14} />
              <span>Assigned Team Unit</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>
              {user?.team || 'Global'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Mail size={14} />
              <span>Contact Email</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '4px', wordBreak: 'break-all' }}>
              {user?.email}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Phone size={14} />
              <span>Phone Number</span>
            </div>
            {editing ? (
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="Phone Number" />
            ) : <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '4px' }}>{user?.phone || user?.candidateId?.phone || 'Not provided'}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          {editing ? <>
            <Button variant="secondary" icon={X} onClick={() => { setEditing(false); setPhone(user?.phone || user?.candidateId?.phone || ''); }}>Cancel</Button>
            <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>Save</Button>
          </> : <Button variant="secondary" icon={Edit2} onClick={() => setEditing(true)}>Edit</Button>}
        </div>
      </Card>
    </div>
  );
};
