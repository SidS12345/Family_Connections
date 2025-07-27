import React, { useState } from 'react';
import './AuthForm.css';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', profile_pic: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (res.ok) setTimeout(() => navigate('/login'), 1200);
  };
  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="profile_pic" placeholder="Profile Picture URL (optional)" value={form.profile_pic} onChange={handleChange} />
        <button type="submit">Create Account</button>
      </form>
      {message && <div className="form-message">{message}</div>}
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}

export default Register;
