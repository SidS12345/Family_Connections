import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';
import './Profile.css';

function MyRelationships() {
  const [relationships, setRelationships] = useState([]);
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const email = localStorage.getItem('loggedInEmail');
  const navigate = useNavigate();

  const fetchRelationships = async () => {
    if (!email) return;

    let user = currentUser;
    if (!user) {
        const usersRes = await fetch('http://127.0.0.1:5000/users');
        const users = await usersRes.json();
        user = users.find(u => u.email === email);
        if (!user) return;
        setCurrentUser(user);
    }

    // Accepted relationships
    const relRes = await fetch(`http://127.0.0.1:5000/relationships/${user.id}`);
    const rels = await relRes.json();
    setRelationships(rels);

    // Pending requests sent by this user
    const pendingRes = await fetch(`http://127.0.0.1:5000/connect_requests_sent/${user.id}`);
    const pendings = await pendingRes.json();
    setPending(pendings);
  };

  useEffect(() => {
    fetchRelationships();
  }, [email]);

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleEditRelationship = async (relationshipId, newRelationshipType) => {
    if (!currentUser) return;

    const res = await fetch(`http://127.0.0.1:5000/edit_relationship/${relationshipId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesting_user_id: currentUser.id,
        new_relationship_type: newRelationshipType
      })
    });

    const data = await res.json();
    setMessage(data.message || data.error);

    if (res.ok) {
      fetchRelationships();
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!email) return null;

  return (
    <div className="page-card">
      <h2 style={{ color: '#2d3748', marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '700' }}>
        👥 My Relationships
      </h2>

      {relationships.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#718096', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p>No connections yet. Start connecting with family and friends!</p>
        </div>
      ) : (
        <div className="relationships-list">
          {relationships.map(rel => (
            <RelationshipCard
              key={rel.relationship_id}
              relationship={rel}
              onViewProfile={handleViewProfile}
              onEditRelationship={handleEditRelationship}
            />
          ))}
        </div>
      )}

      <h3 style={{marginTop: '2rem', color: '#2d3748', fontSize: '1.3rem', fontWeight: '600'}}>
        ⏳ Pending Requests Sent
      </h3>

      {pending.length === 0 ? (
        <div style={{ color: '#718096', padding: '1rem 0' }}>
          <p>No pending requests.</p>
        </div>
      ) : (
        <div className="pending-list">
          {pending.map(req => (
            <div key={req.request_id} className="user-card pending-card">
              <div className="relationship-info">
                <span className="pending-name">{req.to_name}</span>
                <span className="relationship-type">({req.relationship})</span>
                <span className="pending-status">- Pending</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className={`form-message ${message.includes('sent') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

// Enhanced relationship card component with editing capabilities
function RelationshipCard({ relationship, onViewProfile, onEditRelationship }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState('');

  const handleEdit = () => {
    setNewRelationshipType(relationship.my_relationship_type);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!newRelationshipType.trim()) {
      alert('Please enter a relationship type');
      return;
    }
    onEditRelationship(relationship.relationship_id, newRelationshipType);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewRelationshipType('');
  };

  return (
    <div className="user-card relationship-card">
      <div className="relationship-details">
        <div className="relationship-header">
          <button
            className="profile-link"
            onClick={() => onViewProfile(relationship.relative_id)}
            title="View profile"
          >
            {relationship.name}
          </button>
        </div>

        {!isEditing ? (
          <div className="relationship-types">
            <div className="relationship-bidirectional">
              <span className="my-relationship">
                You call them: <strong>{relationship.my_relationship_type}</strong>
              </span>
              <span className="their-relationship">
                They call you: <strong>{relationship.their_relationship_type}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="edit-relationship-form">
            <div className="form-group">
              <label className="form-label">Edit your relationship to {relationship.name}:</label>
              <input
                type="text"
                className="form-input"
                value={newRelationshipType}
                onChange={(e) => setNewRelationshipType(e.target.value)}
                placeholder="e.g., friend, brother, cousin"
              />
            </div>
          </div>
        )}
      </div>

      <div className="relationship-actions">
        {!isEditing ? (
          <>
            <button
              className="btn-secondary view-profile-btn"
              onClick={() => onViewProfile(relationship.relative_id)}
            >
              👤 View Profile
            </button>
            <button
              className="btn-secondary edit-relationship-btn"
              onClick={handleEdit}
            >
              ✏️ Edit
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-primary"
              onClick={handleSaveEdit}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              💾 Save
            </button>
            <button
              className="btn-secondary"
              onClick={handleCancelEdit}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              ❌ Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MyRelationships;
