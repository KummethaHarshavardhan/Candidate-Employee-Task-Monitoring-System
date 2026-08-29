import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Phone, Briefcase, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import spaxiosLogo from '../../assets/spaxios-logo.svg';
import './RegisterPage.css';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Software Engineering',
    designation: 'Candidate / Engineer',
    team: 'Team Alpha',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        team: formData.team,
        password: formData.password,
      });

      toast.success('Registration completed successfully! Welcome to SPAXIOS INNOVATION.', 'Account Created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('[Register Error]:', err);
      setError(err.message || 'Registration failed. Please check your details.');
      toast.error(err.message || 'Registration failed', 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '0.5rem' }}>
            <img
              src={spaxiosLogo}
              alt="SPAXIOS INNOVATION"
              style={{
                height: '42px',
                maxWidth: '220px',
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block',
              }}
            />
          </Link>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Candidate & Employee Account Registration
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="register-form" style={{ display: 'flex', flexDirection: 'column' }}>
          <Input
            label="Full Name"
            name="name"
            id="register-name"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={handleChange}
            icon={User}
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            name="email"
            id="register-email"
            type="email"
            placeholder="jane.doe@company.com"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            required
            autoComplete="email"
          />

          <div className="grid">
            <Input
              label="Phone Number (Optional)"
              name="phone"
              id="register-phone"
              placeholder="+1 555-0199"
              value={formData.phone}
              onChange={handleChange}
              icon={Phone}
              autoComplete="tel"
            />
            <Input
              label="Assigned Team"
              name="team"
              id="register-team"
              placeholder="e.g. Team Alpha"
              value={formData.team}
              onChange={handleChange}
              icon={Users}
              required
            />
          </div>

          <div className="grid">
            <Input
              label="Department"
              name="department"
              id="register-dept"
              placeholder="e.g. Frontend Engineering"
              value={formData.department}
              onChange={handleChange}
              icon={Briefcase}
              required
            />
            <Input
              label="Designation"
              name="designation"
              id="register-desig"
              placeholder="e.g. React Developer Intern"
              value={formData.designation}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid">
            <Input
              label="Password"
              name="password"
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              id="register-confirm-password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={Lock}
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
            style={{ marginTop: '0.5rem', padding: '0.75rem', fontWeight: 700 }}
          >
            <span>Create Candidate Account</span>
            <ArrowRight size={16} />
          </Button>

          <div style={{ textAlign: 'center', marginTop: '0.85rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

