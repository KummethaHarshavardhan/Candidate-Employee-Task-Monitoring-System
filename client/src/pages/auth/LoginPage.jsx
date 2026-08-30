import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import spaxiosLogo from '../../assets/spaxios-logo.svg';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      toast.success('Logged in successfully', 'Welcome');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Login failed', 'Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: 'clamp(0.75rem, 3vw, 1.5rem)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(79, 70, 229, 0.12), transparent 70%)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(1.25rem, 4vw, 2.5rem)',
          boxShadow: 'var(--shadow-xl)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '0.75rem' }}>
            <img
              src={spaxiosLogo}
              alt="SPAXIOS INNOVATION"
              style={{
                height: '48px',
                maxWidth: '240px',
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block',
              }}
            />
          </Link>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Candidate & Employee Task Monitoring System
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: '#fca5a5',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
            autoComplete="current-password"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem', marginBottom: '1.25rem' }}>
            <Link
              to="/forgot-password"
              style={{
                color: '#818cf8',
                fontSize: '0.825rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
            style={{ marginTop: '0.25rem', padding: '0.75rem' }}
          >
            <span>Sign In to System</span>
            <ArrowRight size={16} />
          </Button>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            New candidate/employee?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Register Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
