import React, { useState } from 'react';
import './AuthForm.css';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', profile_pic: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch("http://127.0.0.1:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="form-icon">👨‍👩‍👧‍👦</div>
      <h2>Join Our Family</h2>
      <p className="subtitle">Create your account to connect with family and friends</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

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
            placeholder="Create a secure password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Profile Picture URL (Optional)</label>
          <input
            name="profile_pic"
            type="url"
            placeholder="https://example.com/your-photo.jpg"
            value={form.profile_pic}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <span className="loading"></span> : null}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {message && (
        <div className={`form-message ${message.includes('successfully') ? 'success' : message.includes('failed') || message.includes('error') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      <p>Already have an account? <Link to="/login">Sign in here</Link></p>
    </div>
  );
}

export default Register;
