import React, { useEffect, useState } from 'react';
import './AuthForm.css';

function MyRelationships() {
  const [relationships, setRelationships] = useState([]);
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('loggedInEmail');

  useEffect(() => {
    async function fetchRelationships() {
      if (!email) return;
      const usersRes = await fetch('http://127.0.0.1:5000/users');
      const users = await usersRes.json();
      const user = users.find(u => u.email === email);
      if (!user) return;
      // Accepted relationships
      const relRes = await fetch(`http://127.0.0.1:5000/relationships/${user.id}`);
      const rels = await relRes.json();
      setRelationships(rels.filter(r => !r.direction || r.direction === 'to' || r.direction === 'from'));
      // Pending requests sent by this user
      const pendingRes = await fetch('http://127.0.0.1:5000/connect_requests_sent/' + user.id);
      const pendings = await pendingRes.json();
      setPending(pendings);
    }
    fetchRelationships();
  }, [email]);

  if (!email) return null;

  return (
    <div className="auth-form">
      <h2>My Relationships</h2>
      {relationships.length === 0 && <div>No relationships found.</div>}
      {relationships.map(rel => (
        <div key={rel.relative_id} style={{marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem'}}>
          <div><b>{rel.name}</b> ({rel.relationship})</div>
        </div>
      ))}
      <h3 style={{marginTop: '2rem'}}>Pending Requests Sent</h3>
      {pending.length === 0 && <div>No pending requests.</div>}
      {pending.map(req => (
        <div key={req.request_id} style={{marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem'}}>
          <div><b>{req.to_name}</b> ({req.relationship}) - Pending</div>
        </div>
      ))}
      {message && <div className="form-message">{message}</div>}
    </div>
  );
}
export default MyRelationships;
