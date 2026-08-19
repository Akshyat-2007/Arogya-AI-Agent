'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode can be 'login' or 'signup'
  const [mode, setMode] = useState('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5001/api/auth';

  useEffect(() => {
    // Read optional mode from query params
    const initialMode = searchParams.get('mode');
    if (initialMode === 'signup' || initialMode === 'login') {
      setMode(initialMode);
    }

    // Redirect if already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  // Client-side input validation
  const validateForm = () => {
    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/login' : '/signup';
      const payload = mode === 'login' 
        ? { email: email.trim(), password }
        : { email: email.trim(), username: username.trim() || null, password };

      const res = await fetch(`${AUTH_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // Success
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      setSuccess(mode === 'login' ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');
      
      // Redirect to home/dashboard page and force refresh to reload Navbar state
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="row justify-content-center my-5 py-3">
      <div className="col-md-6 col-lg-5">
        <div className="glass-card-static p-4 shadow-lg border border-secondary-subtle">
          <div className="text-center mb-4">
            <i className="fas fa-heartbeat text-grad-primary fs-1 mb-2"></i>
            <h3 className="fw-bold mb-1 font-heading">
              {mode === 'login' ? 'Login to Arogya AI' : 'Create Your Account'}
            </h3>
            <p className="text-secondary small">
              {mode === 'login' 
                ? 'Enter your credentials to access your health portal' 
                : 'Sign up to manage personalized family nutrition plans'}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger-subtle bg-danger-subtle border border-danger-subtle text-danger py-2.5 px-3 rounded-3 small mb-3">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success-subtle bg-success-subtle border border-success-subtle text-success py-2.5 px-3 rounded-3 small mb-3">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label small fw-semibold text-secondary">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                placeholder="e.g. name@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <div className="mb-3">
                <label htmlFor="usernameInput" className="form-label small fw-semibold text-secondary">
                  Username <span className="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="usernameInput"
                  placeholder="e.g. ramesh_k"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="passwordInput" className="form-label small fw-semibold text-secondary">
                Password <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control"
                id="passwordInput"
                placeholder="Minimum 6 characters"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {mode === 'signup' && (
              <div className="mb-4">
                <label htmlFor="confirmPasswordInput" className="form-label small fw-semibold text-secondary">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPasswordInput"
                  placeholder="Repeat your password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-grad w-100 py-2.5 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                mode === 'login' ? 'Login' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-3 border-top border-secondary-subtle">
            <span className="text-secondary small">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={toggleMode}
              className="btn btn-link btn-sm text-primary p-0 border-0 fw-semibold text-decoration-none"
              style={{ fontSize: '0.875rem' }}
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
