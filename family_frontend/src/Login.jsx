import React, { useState } from 'react';
import './AuthForm.css';
import { useNavigate, Link } from 'react-router-dom';

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("loggedInEmail", form.email);
        if (onLogin) onLogin();
        navigate('/profile');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form login">
      <div className="form-icon">🔐</div>
      <h2>Welcome Back</h2>
      <p className="subtitle">Sign in to your family account</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <span className="loading"></span> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {message && (
        <div className={`form-message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <p>Don't have an account? <Link to="/register">Create one here</Link></p>
    </div>
  );
}

export default Login;
