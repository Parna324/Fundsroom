import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const TEST_ACCOUNTS = [
    { email: 'admin@test.com',     role: 'Admin',     color: '#818cf8' },
    { email: 'sales@test.com',     role: 'Sales',     color: '#4ade80' },
    { email: 'warehouse@test.com', role: 'Warehouse', color: '#fbbf24' },
    { email: 'accounts@test.com',  role: 'Accounts',  color: '#60a5fa' },
  ];

  return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-bg-glow-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏢</div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Mini ERP
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Operations Portal
            </div>
          </div>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to access your workspace</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-5)' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 'var(--space-4)', padding: '0.75rem' }}
            disabled={isLoading}
            id="login-submit-btn"
          >
            {isLoading ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="divider" style={{ margin: 'var(--space-6) 0' }} />

        {/* Test credentials */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Test Accounts (password: Test@1234)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {TEST_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', gap: 'var(--space-3)', padding: '0.5rem 0.75rem' }}
                onClick={() => { setEmail(acc.email); setPassword('Test@1234'); }}
                id={`quick-login-${acc.role.toLowerCase()}`}
              >
                <span style={{
                  display: 'inline-block',
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  background: acc.color,
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem' }}>{acc.email}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
