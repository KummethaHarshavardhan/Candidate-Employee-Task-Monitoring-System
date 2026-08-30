import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import spaxiosLogo from '../../assets/spaxios-logo.svg';
import './ForgotPasswordPage.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const validateEmail = (val) => {
    return /^\S+@\S+\.\S+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(trimmedEmail);
      toast.success(
        'If an account exists for this email address, a verification code has been sent.',
        'Verification Code Sent'
      );
      // Navigate to OTP verification page, passing the email via route state
      navigate('/verify-otp', { state: { email: trimmedEmail } });
    } catch (err) {
      console.error('[Forgot Password Error]:', err);
      const message = err.message || 'Unable to process request. Please try again later.';
      setError(message);
      toast.error(message, 'Request Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '0.75rem' }}>
            <img
              src={spaxiosLogo}
              alt="SPAXIOS INNOVATION"
              style={{
                height: '46px',
                maxWidth: '240px',
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block',
              }}
            />
          </Link>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Candidate & Employee Task Monitoring System
          </p>
        </div>

        <div className="header-icon-container">
          <KeyRound size={26} />
        </div>

        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          Forgot Password?
        </h2>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}
        >
          Enter your registered email address and we'll send you a verification code to reset your password.
        </p>

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

        <form onSubmit={handleSubmit}>
          <Input
            label="Registered Email Address"
            id="forgot-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            icon={Mail}
            required
            autoFocus
            autoComplete="email"
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !email.trim()}
            className="w-full"
            style={{ marginTop: '0.75rem', padding: '0.75rem', fontWeight: 600 }}
          >
            <span>Send OTP</span>
            <Send size={16} />
          </Button>

          <div
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>

          <div className="info-hint">
            🔒 For security, the verification code expires in 5 minutes and can only be used once.
          </div>
        </form>
      </div>
    </div>
  );
};
