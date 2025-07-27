import React, { useEffect, useState } from 'react';
import './AuthForm.css';

function Requests() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('loggedInEmail');

  useEffect(() => {
    async function fetchRequests() {
      if (!email) return;
      const usersRes = await fetch('http://127.0.0.1:5000/users');
      const users = await usersRes.json();
      const user = users.find(u => u.email === email);
      if (!user) return;
      const reqRes = await fetch(`http://127.0.0.1:5000/relationship_requests/${user.id}`);
      const reqs = await reqRes.json();
      setRequests(reqs);
    }
    fetchRequests();
  }, [email]);

  const handleRespond = async (request_id, status) => {
    const res = await fetch(`http://127.0.0.1:5000/respond_relationship/${request_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setRequests(requests.filter(r => r.request_id !== request_id));
  };

  if (!email) return null;

  return (
    <div className="auth-form">
      <h2>Connection Requests</h2>
      {requests.length === 0 && <div>No pending requests.</div>}
      {requests.map(req => (
        <div key={req.request_id} style={{marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem'}}>
          <div><b>{req.from_name}</b> wants to connect as <b>{req.relationship}</b></div>
          <button onClick={() => handleRespond(req.request_id, 'approved')} style={{marginRight: '0.7rem'}}>Approve</button>
          <button onClick={() => handleRespond(req.request_id, 'declined')}>Decline</button>
        </div>
      ))}
      {message && <div className="form-message">{message}</div>}
    </div>
  );
}
export default Requests;
