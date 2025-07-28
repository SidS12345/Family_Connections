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

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent triggering view profile
    setNewRelationshipType(relationship.my_relationship_type);
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (!newRelationshipType.trim()) {
      alert('Please enter a relationship type');
      return;
    }
    onEditRelationship(relationship.relationship_id, newRelationshipType);
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setNewRelationshipType('');
  };

  // Make the whole card clickable to view profile
  return (
    <div
      className="user-card relationship-card"
      style={{ cursor: 'pointer' }}
      onClick={() => !isEditing && onViewProfile(relationship.relative_id)}
      tabIndex={0}
      onKeyDown={e => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) onViewProfile(relationship.relative_id);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <img
          src={relationship.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'}
          alt="Profile"
          className="profile-pic"
          style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #667eea' }}
        />
        <div className="relationship-details" style={{ flex: 1 }}>
          <div className="relationship-header" style={{ textAlign: 'left', marginBottom: 0 }}>
            <span className="profile-link" style={{ cursor: 'inherit', fontWeight: 600, fontSize: '1.1rem', textAlign: 'left', display: 'block', marginBottom: 0 }}>
              {relationship.name}
            </span>
          </div>
          {/* Only show 'Your x' (my_relationship_type) */}
          {!isEditing ? (
            <div className="relationship-types" style={{ textAlign: 'left', marginTop: 0 }}>
              <span className="my-relationship" style={{ display: 'block', marginTop: 0 }}>
                Your <strong>{relationship.my_relationship_type}</strong>
              </span>
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
        {/* Show edit button only if not editing */}
        {!isEditing && (
          <button
            className="btn-secondary edit-relationship-btn"
            style={{ marginLeft: '1rem' }}
            onClick={handleEdit}
            tabIndex={-1}
          >
            ✏️
          </button>
        )}
      </div>
      {/* Editing actions */}
      {isEditing && (
        <div className="relationship-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
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
        </div>
      )}
    </div>
  );
}

export default MyRelationships;
