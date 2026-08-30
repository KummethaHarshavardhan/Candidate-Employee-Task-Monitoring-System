import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RotateCw, Clock, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button/Button';
import spaxiosLogo from '../../assets/spaxios-logo.svg';
import './VerifyOTPPage.css';

export const VerifyOTPPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const passedEmail = location.state?.email || sessionStorage.getItem('otp_email') || '';

  const [email] = useState(passedEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  // 5-minute total OTP expiration timer (300 seconds)
  const [expiresInSeconds, setExpiresInSeconds] = useState(300);
  // 60-second resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Save email to sessionStorage for tab refresh persistence
  useEffect(() => {
    if (passedEmail) {
      sessionStorage.setItem('otp_email', passedEmail);
    }
  }, [passedEmail]);

  // Focus the first OTP box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Expiration countdown effect
  useEffect(() => {
    if (expiresInSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresInSeconds]);

  // Resend cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Mask email for privacy (e.g., j***e@company.com)
  const maskEmail = (em) => {
    if (!em) return '';
    const [user, domain] = em.split('@');
    if (!domain) return em;
    if (user.length <= 2) {
      return `${user[0]}*@${domain}`;
    }
    const visibleStart = user.slice(0, 2);
    const visibleEnd = user.slice(-1);
    const masked = '*'.repeat(Math.max(user.length - 3, 2));
    return `${visibleStart}${masked}${visibleEnd}@${domain}`;
  };

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    // Only accept numeric input
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleanValue.slice(-1); // Take last digit if multiple
    setOtp(newOtp);
    if (error) setError('');

    // Auto-advance to next input box if a digit was entered
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, focus previous box on backspace
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasteData[i] || '';
    }
    setOtp(newOtp);
    if (error) setError('');

    // Focus the box corresponding to paste length
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email) {
      setError('Email address is missing. Please restart the password reset process.');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code');
      return;
    }

    if (expiresInSeconds <= 0) {
      setError('This verification code has expired. Please click Resend OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOTP(email, otpCode);
      const resetAuthToken = res.data?.resetAuthToken;

      toast.success('OTP verified successfully.', 'Code Verified');

      // Navigate to Reset Password page with authorization token in state
      navigate('/reset-password', {
        state: {
          email,
          resetAuthToken,
        },
      });
    } catch (err) {
      console.error('[Verify OTP Error]:', err);
      const message = err.message || 'The verification code is invalid.';
      setError(message);
      toast.error(message, 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');

    try {
      setResending(true);
      await authService.forgotPassword(email);
      setOtp(['', '', '', '', '', '']);
      setExpiresInSeconds(300); // Reset 5 min expiry
      setResendCooldown(60); // Reset 60 sec cooldown
      toast.success('A new 6-digit verification code has been sent to your email.', 'Code Resent');
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('[Resend OTP Error]:', err);
      const message = err.message || 'Failed to resend code. Please try again.';
      setError(message);
      toast.error(message, 'Resend Failed');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="verify-otp-wrapper">
        <div className="verify-otp-card" style={{ textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <img
                src={spaxiosLogo}
                alt="SPAXIOS INNOVATION"
                style={{ height: '46px', maxWidth: '240px', objectFit: 'contain' }}
              />
            </Link>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            No Email Provided
          </h2>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Please enter your email on the Forgot Password page first to receive your verification code.
          </p>

          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Button variant="primary" className="w-full" style={{ padding: '0.75rem' }}>
              Go to Forgot Password
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-otp-wrapper">
      <div className="verify-otp-card">
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
          <ShieldCheck size={26} />
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
          Verify OTP
        </h2>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            marginBottom: '0.5rem',
            lineHeight: 1.5,
          }}
        >
          We've sent a 6-digit verification code to
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#818cf8',
            textAlign: 'center',
            marginBottom: '1.25rem',
          }}
        >
          {maskEmail(email)}
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
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          {/* 6 Individual OTP Input Boxes */}
          <div className="otp-boxes-container" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`otp-box-input ${digit ? 'filled' : ''}`}
                disabled={loading}
                aria-label={`Digit ${idx + 1} of verification code`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {/* Timer & Resend Controls */}
          <div className="otp-status-panel">
            <div className={`otp-timer ${expiresInSeconds < 60 ? 'expiring' : ''}`}>
              <Clock size={14} />
              <span>
                {expiresInSeconds > 0
                  ? `Expires in ${formatTime(expiresInSeconds)}`
                  : 'Code expired'}
              </span>
            </div>

            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
            >
              <RotateCw size={13} className={resending ? 'spinner' : ''} />
              <span>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resending
                  ? 'Resending...'
                  : 'Resend OTP'}
              </span>
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !isOtpComplete}
            className="w-full"
            style={{ padding: '0.75rem', fontWeight: 600 }}
          >
            <span>Verify OTP</span>
            <ArrowRight size={16} />
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
            <Link to="/forgot-password" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Change Email
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
