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
    // If the user clicks on their own profile, navigate to /profile (not /profile/:id)
    if (currentUser && userId === currentUser.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
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
      <h2 style={{ 
        color: '#ffffff',
        marginBottom: '2rem', 
        fontSize: '2rem', 
        fontWeight: '700',
        letterSpacing: '-0.5px',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        My Relationships
      </h2>

      {relationships.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', padding: '2rem 0' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            filter: 'grayscale(50%)',
            opacity: 0.5
          }}>👥</div>
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

      <h3 style={{
        marginTop: '2rem', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: '1.3rem', 
        fontWeight: '600',
        letterSpacing: '-0.3px'
      }}>
        Pending Requests Sent
      </h3>

      {pending.length === 0 ? (
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', padding: '1rem 0' }}>
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.5rem', 
        padding: '1.5rem', 
        background: 'rgba(255, 255, 255, 0.08)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)', 
        border: '1px solid rgba(255, 255, 255, 0.18)', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        minHeight: 90 
      }}>
        <img
          src={relationship.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'}
          alt="Profile"
          className="profile-pic"
          style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            objectFit: 'cover', 
            border: '2px solid rgba(255, 255, 255, 0.3)', 
            boxShadow: '0 4px 20px rgba(118, 75, 162, 0.2)' 
          }}
        />
        <div className="relationship-details" style={{ flex: 1 }}>
          <div className="relationship-header" style={{ textAlign: 'left', marginBottom: 0 }}>
            <span className="profile-link" style={{ 
              cursor: 'inherit', 
              fontWeight: 700, 
              fontSize: '1.15rem', 
              textAlign: 'left', 
              display: 'block', 
              marginBottom: 0, 
              color: 'rgba(255, 255, 255, 0.95)', 
              letterSpacing: '-0.3px' 
            }}>
              {relationship.name}
            </span>
          </div>
          {/* Only show 'Your x' (my_relationship_type) */}
          {!isEditing ? (
            <div className="relationship-types" style={{ textAlign: 'left', marginTop: 0 }}>
              <span className="my-relationship" style={{ 
                display: 'block', 
                marginTop: 0, 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontWeight: 600, 
                fontSize: '1.05rem', 
                letterSpacing: '0.01em' 
              }}>
                Your <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{relationship.my_relationship_type}</strong>
              </span>
            </div>
          ) : (
            <div className="edit-relationship-form">
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Edit your relationship to {relationship.name}:</label>
                <input
                  type="text"
                  className="form-input"
                  value={newRelationshipType}
                  onChange={(e) => setNewRelationshipType(e.target.value)}
                  placeholder="e.g., friend, brother, cousin"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.08)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '12px',
                    color: 'white',
                    padding: '0.75rem'
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {/* Show action buttons only if not editing */}
        {!isEditing && (
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button
              className="btn-secondary message-btn"
              style={{ 
                background: 'linear-gradient(135deg, #22a745, #a8e063)', 
                color: 'white', 
                border: '1px solid rgba(34, 167, 69, 0.3)', 
                borderRadius: '50%', 
                width: 38, 
                height: 38, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.1rem', 
                boxShadow: '0 4px 16px rgba(34, 167, 69, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/chat/${relationship.relative_id}`;
              }}
              tabIndex={-1}
              title="Send message"
            >
              💬
            </button>
            <button
              className="btn-secondary edit-relationship-btn"
              style={{ 
                background: 'linear-gradient(135deg, #764ba2, #667eea)', 
                color: 'white', 
                border: '1px solid rgba(102, 126, 234, 0.3)', 
                borderRadius: '50%', 
                width: 38, 
                height: 38, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.2rem', 
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onClick={handleEdit}
              tabIndex={-1}
              title="Edit relationship"
            >
              ✏️
            </button>
          </div>
        )}
      </div>
      {/* Editing actions */}
      {isEditing && (
        <div className="relationship-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            onClick={handleSaveEdit}
            style={{ fontSize: '0.95rem', padding: '0.6rem 1.3rem', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            💾 Save
          </button>
          <button
            className="btn-secondary"
            onClick={handleCancelEdit}
            style={{ 
              fontSize: '0.95rem', 
              padding: '0.6rem 1.3rem', 
              borderRadius: '12px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              color: 'white', 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            ❌ Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default MyRelationships;
