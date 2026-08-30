import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, Check, X, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import spaxiosLogo from '../../assets/spaxios-logo.svg';
import './ResetPasswordPage.css';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const email = location.state?.email || '';
  const resetAuthToken = location.state?.resetAuthToken || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  // Requirements checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecialChar &&
    passwordsMatch;

  // Handle countdown redirect on success
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      navigate('/login', { replace: true });
    }
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !resetAuthToken) {
      setError('Password reset authorization is missing. Please verify your OTP again.');
      return;
    }

    if (!isFormValid) {
      setError('Please make sure all password requirements are satisfied.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email, password, resetAuthToken);
      sessionStorage.removeItem('otp_email');
      setSuccess(true);
      toast.success('Your password has been reset successfully.', 'Password Updated');
    } catch (err) {
      console.error('[Reset Password Error]:', err);
      const msg =
        err.message ||
        'Password reset authorization has expired or is invalid. Please request a new verification code.';
      setError(msg);
      toast.error(msg, 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  // If unauthorized entry without OTP verification token
  if (!email || !resetAuthToken) {
    return (
      <div className="reset-password-wrapper">
        <div className="reset-password-card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
          </div>

          <div className="error-icon-container">
            <AlertCircle size={30} />
          </div>

          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '0.75rem',
              color: 'var(--text-primary)',
            }}
          >
            Verification Required
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
            To create a new password, you must first verify the 6-digit OTP sent to your registered email.
          </p>

          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Button variant="primary" className="w-full" style={{ padding: '0.75rem' }}>
              Start Password Reset
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-wrapper">
      <div className="reset-password-card">
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

        {success ? (
          /* Success State */
          <div>
            <div className="success-icon-container">
              <CheckCircle2 size={30} />
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
              Password Reset Complete
            </h2>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              Your password has been reset successfully. You can now sign in with your new password.
            </p>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                textAlign: 'center',
                fontSize: '0.825rem',
                color: '#34d399',
                marginBottom: '1.5rem',
              }}
            >
              Redirecting to login page in <strong>{countdown}</strong> seconds...
            </div>

            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="primary"
                className="w-full"
                icon={ArrowRight}
                style={{ padding: '0.75rem', fontWeight: 600 }}
              >
                Sign In to System Now
              </Button>
            </Link>
          </div>
        ) : (
          /* Reset Form */
          <div>
            <div className="header-icon-container">
              <Key size={26} />
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
              Create New Password
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
              Please enter a strong new password for your account.
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
                label="New Password"
                id="reset-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                icon={Lock}
                required
                autoComplete="new-password"
                disabled={loading}
              />

              {/* Live Password Requirements Checklist */}
              <div className="password-requirements-card">
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Password Requirements:
                </div>
                <div className={`requirement-item ${hasMinLength ? 'valid' : 'invalid'}`}>
                  {hasMinLength ? <Check size={14} /> : <X size={14} />}
                  <span>At least 8 characters long</span>
                </div>
                <div className={`requirement-item ${hasUppercase ? 'valid' : 'invalid'}`}>
                  {hasUppercase ? <Check size={14} /> : <X size={14} />}
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`requirement-item ${hasNumber ? 'valid' : 'invalid'}`}>
                  {hasNumber ? <Check size={14} /> : <X size={14} />}
                  <span>At least one number (0-9)</span>
                </div>
                <div className={`requirement-item ${hasSpecialChar ? 'valid' : 'invalid'}`}>
                  {hasSpecialChar ? <Check size={14} /> : <X size={14} />}
                  <span>At least one special character (!@#$%^&*)</span>
                </div>
              </div>

              <Input
                label="Confirm New Password"
                id="reset-confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                icon={Lock}
                required
                autoComplete="new-password"
                disabled={loading}
              />

              {confirmPassword && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.775rem',
                    marginTop: '-0.5rem',
                    marginBottom: '1rem',
                    color: passwordsMatch ? '#34d399' : '#f87171',
                  }}
                >
                  {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !isFormValid}
                className="w-full"
                style={{ marginTop: '0.5rem', padding: '0.75rem', fontWeight: 600 }}
              >
                <span>Reset Password</span>
                <ShieldCheck size={16} />
              </Button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Remembered your password?{' '}
                <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
