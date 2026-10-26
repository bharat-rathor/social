import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2, UserPlus, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useNotification();

  const registeredEmail = location.state?.registeredEmail || '';
  const registeredName = location.state?.name || '';
  const justRegistered = !!location.state?.justRegistered;

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [registeredEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password });
      showToast('success', 'Welcome Back!', `Signed in as ${user.name}`);
      
      if (user.isProfileComplete === false) {
        navigate('/create-profile');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please verify your credentials.');
      showToast('error', 'Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast('info', 'Password Recovery', 'For account recovery assistance, please reach out to support@socialconnect.local with your registered email.');
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
          <h2>Welcome Back</h2>
          <p>Sign in to access your profile, chats, and connections</p>
        </div>

        {/* Auth Navigation Tabs (Sign In / Register) */}
        <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
          <Link to="/login" className="auth-tab active" role="tab" aria-selected="true">
            <LogIn size={16} />
            <span>Sign In</span>
          </Link>
          <Link to="/register" className="auth-tab" role="tab" aria-selected="false">
            <UserPlus size={16} />
            <span>Create Account</span>
          </Link>
        </div>

        {/* Celebration Banner when user arrives after registering */}
        {justRegistered && (
          <div className="auth-banner-success">
            <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: '#065f46', marginBottom: 2 }}>
                {registeredName ? `Welcome, ${registeredName}!` : 'Account Registered Successfully!'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#047857' }}>
                Your account is ready. Please enter your password to sign in.
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{error}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" htmlFor="login-email" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
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
              <label className="form-label" htmlFor="login-password" style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: 42, paddingRight: 42, height: 48, borderRadius: 'var(--radius-md)' }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: 16, height: 16, cursor: 'pointer' }}
              />
              <span>Remember this device</span>
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
            <LogIn size={19} />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        {/* New to Platform Callout */}
        <div className="auth-callout-register" style={{ marginTop: 24 }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
              New to Social Connect?
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Create an account first to start connecting.
            </div>
          </div>
          <Link
            to="/register"
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
            <span>Register</span>
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
            <span>Secure Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
