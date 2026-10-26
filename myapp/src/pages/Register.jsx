import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, User, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444', percent: '25%' };
    if (score === 2) return { level: 2, label: 'Fair', color: '#f59e0b', percent: '50%' };
    if (score === 3) return { level: 3, label: 'Good', color: '#10b981', percent: '75%' };
    return { level: 4, label: 'Strong', color: '#10b981', percent: '100%' };
  }, [password]);

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      // Register account (without autoLogin session so user follows register -> login flow)
      await register({ name: name.trim(), email: email.trim(), password }, false);
      showToast('success', 'Account Registered!', 'Your account has been created. Please sign in with your password.');
      navigate('/login', {
        state: {
          registeredEmail: email.trim(),
          name: name.trim(),
          justRegistered: true
        }
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
      showToast('error', 'Registration Failed', err.message || 'Please try another email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }} aria-label="Social Connect Home">
            <div className="auth-badge-logo">
              <Users size={26} strokeWidth={2.2} />
            </div>
          </Link>
          <h2>Create Account</h2>
          <p>Join Gujarat's vibrant social discovery community today</p>
        </div>

        {/* Auth Navigation Tabs (Sign In / Register) */}
        <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
          <Link to="/login" className="auth-tab" role="tab" aria-selected="false">
            <LogIn size={16} />
            <span>Sign In</span>
          </Link>
          <Link to="/register" className="auth-tab active" role="tab" aria-selected="true">
            <UserPlus size={16} />
            <span>Create Account</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="reg-name" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: 42, height: 48, borderRadius: 'var(--radius-md)' }}
                placeholder="e.g. Ronak Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <User
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="reg-email" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: 42, height: 48, borderRadius: 'var(--radius-md)' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Mail
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" htmlFor="reg-password" style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </label>
              {password && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 42, paddingRight: 42, height: 48, borderRadius: 'var(--radius-md)' }}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <Lock
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator Bar */}
            {password && (
              <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: passwordStrength.percent,
                    background: passwordStrength.color,
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" htmlFor="reg-confirm-password" style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Confirm Password
              </label>
              {passwordsMatch && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 size={12} /> Matches
                </span>
              )}
              {passwordsMismatch && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>
                  Passwords do not match
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                style={{
                  paddingLeft: 42,
                  paddingRight: 42,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  borderColor: passwordsMismatch ? '#ef4444' : (passwordsMatch ? '#10b981' : undefined)
                }}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <Lock
                size={18}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 20 }}>
            <input
              type="checkbox"
              id="terms-check"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: 16, height: 16, marginTop: 2, cursor: 'pointer' }}
            />
            <label htmlFor="terms-check" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
              I agree to the <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</span>.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            style={{
              width: '100%',
              height: 48,
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            disabled={loading}
          >
            <UserPlus size={19} />
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        {/* Already have an account Callout */}
        <div className="auth-callout-register" style={{ marginTop: 24 }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Already registered?
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sign in with your email and password.
            </div>
          </div>
          <Link
            to="/login"
            className="btn btn-sm btn-secondary"
            style={{
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap'
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Security / Community Trust Badges */}
        <div className="auth-trust-badges">
          <div className="auth-trust-item">
            <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
            <span>256-bit Encrypted</span>
          </div>
          <div className="auth-trust-item">
            <Sparkles size={14} style={{ color: 'var(--gold)' }} />
            <span>Verified Profiles</span>
          </div>
          <div className="auth-trust-item">
            <KeyRound size={14} style={{ color: 'var(--primary)' }} />
            <span>Free to Join</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
