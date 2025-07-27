import React, { useEffect, useState } from 'react';
import './AuthForm.css';

function Requests() {
  const [requests, setRequests] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const email = localStorage.getItem('loggedInEmail');

  const fetchAllRequests = async () => {
    if (!email) return;

    // Fetch current user once
    if (!currentUser) {
      const usersRes = await fetch('http://127.0.0.1:5000/users');
      const users = await usersRes.json();
      const user = users.find(u => u.email === email);
      if (!user) return;
      setCurrentUser(user);
    }

    if (currentUser) {
      // Fetch connection requests
      const reqRes = await fetch(`http://127.0.0.1:5000/relationship_requests/${currentUser.id}`);
      const reqs = await reqRes.json();
      setRequests(reqs);

      // Fetch relationship edit requests
      const editReqRes = await fetch(`http://127.0.0.1:5000/relationship_edit_requests/${currentUser.id}`);
      const editReqs = await editReqRes.json();
      setEditRequests(editReqs);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, [email, currentUser]);

  const handleRespond = async (request_id, status, reverseRelationshipType = null) => {
    const payload = { status };
    if (status === 'approved') {
      if (!reverseRelationshipType || !reverseRelationshipType.trim()) {
        alert("Please define your relationship to this person.");
        return;
      }
      payload.reverse_relationship_type = reverseRelationshipType;
    }

    const res = await fetch(`http://127.0.0.1:5000/respond_relationship/${request_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setMessage(data.message || data.error);

    if (res.ok) {
      fetchAllRequests(); // Refresh all requests
      window.dispatchEvent(new CustomEvent('requestHandled'));
    }
  };

  const handleEditResponse = async (request_id, status) => {
    const res = await fetch(`http://127.0.0.1:5000/respond_edit_request/${request_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    setMessage(data.message || data.error);

    if (res.ok) {
      fetchAllRequests(); // Refresh all requests
    }
  };

  if (!email) return null;

  return (
    <div className="page-card">
      <h2 style={{ color: '#2d3748', marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '700' }}>
        📨 Requests
      </h2>

      {/* Connection Requests */}
      <h3 style={{ color: '#2d3748', marginTop: '1rem', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '600' }}>
        New Connections
      </h3>
      {requests.length > 0 ? requests.map(req => (
        <ConnectionRequestCard
          key={req.request_id}
          request={req}
          onRespond={handleRespond}
        />
      )) : <p className="no-info">No new connection requests.</p>}

      {/* Relationship Edit Requests */}
      <h3 style={{ color: '#2d3748', marginTop: '2rem', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '600' }}>
        ✏️ Relationship Edit Requests
      </h3>
      {editRequests.length > 0 ? editRequests.map(req => (
        <div key={req.request_id} className="user-card">
          <div className="user-name">{req.requesting_user_name}</div>
          <div className="user-email">
            wants to change their relationship to you from <strong>{req.current_relationship_type}</strong> to <strong>{req.new_relationship_type}</strong>.
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => handleEditResponse(req.request_id, 'approved')}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              ✅ Approve Change
            </button>
            <button
              onClick={() => handleEditResponse(req.request_id, 'declined')}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              ❌ Decline
            </button>
          </div>
        </div>
      )) : <p className="no-info">No new relationship edit requests.</p>}

      {message && (
        <div className={`form-message ${message.includes('approved') || message.includes('declined') || message.includes('sent') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

// Separate component for connection request cards with bidirectional approval
function ConnectionRequestCard({ request, onRespond }) {
  const [reverseRelationshipType, setReverseRelationshipType] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const handleApproveClick = () => {
    setShowApprovalForm(true);
  };

  const handleConfirmApproval = () => {
    onRespond(request.request_id, 'approved', reverseRelationshipType);
  };

  return (
    <div className="user-card">
      <div className="user-name">{request.from_name}</div>
      <div className="user-email">wants to connect as your <strong>{request.relationship}</strong>.</div>

      {!showApprovalForm ? (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={handleApproveClick}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            ✅ Accept
          </button>
          <button
            onClick={() => onRespond(request.request_id, 'declined')}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            ❌ Decline
          </button>
        </div>
      ) : (
        <div className="approval-form">
          <div className="form-group">
            <label className="form-label">What is {request.from_name} to you?</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., friend, brother, cousin"
              value={reverseRelationshipType}
              onChange={(e) => setReverseRelationshipType(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleConfirmApproval} className="btn-primary" style={{ flex: 1 }}>
              💾 Confirm Relationship
            </button>
            <button
              onClick={() => setShowApprovalForm(false)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Requests;
