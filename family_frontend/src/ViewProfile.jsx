import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Profile.css';

function ViewProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();
  const email = localStorage.getItem("loggedInEmail");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (email) {
        try {
          const response = await fetch("http://127.0.0.1:5000/users");
          const users = await response.json();
          const user = users.find(u => u.email === email);
          setCurrentUser(user);
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    };
    fetchCurrentUser();
  }, [email]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser || !userId) return;

      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:5000/profile/${userId}?requesting_user_id=${currentUser.id}`);

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Error</h2>
          <p className="form-message error">{error}</p>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Profile not found</h2>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Profile Picture Section */}
        <div className="profile-pic-section">
          <img
            src={profileData.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'}
            alt="Profile"
            className="profile-pic"
          />
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <h2>{profileData.name}</h2>
          {profileData.email && (
            <p className="profile-subtitle">{profileData.email}</p>
          )}
          {!profileData.is_connected && !profileData.is_own_profile && (
            <div className="connection-status">
              <span className="not-connected">🔒 Not Connected</span>
              <p className="connection-note">Connect with this person to see more profile information</p>
            </div>
          )}
          {profileData.is_connected && !profileData.is_own_profile && (
            <div className="connection-status">
              <span className="connected">✅ Connected</span>
            </div>
          )}
        </div>

        {/* Profile Information */}
        {(profileData.is_connected || profileData.is_own_profile) && (
          <div className="profile-info">
            {/* Phone */}
            {profileData.phone && (
              <div className="info-item">
                <div className="info-icon">📞</div>
                <div className="info-content">
                  <div className="info-label">Phone Number</div>
                  <div className="info-value">{profileData.phone}</div>
                </div>
              </div>
            )}

            {/* Job */}
            {profileData.job && (
              <div className="info-item">
                <div className="info-icon">💼</div>
                <div className="info-content">
                  <div className="info-label">Job / Occupation</div>
                  <div className="info-value">{profileData.job}</div>
                </div>
              </div>
            )}

            {/* Location */}
            {profileData.location && (
              <div className="info-item">
                <div className="info-icon">📍</div>
                <div className="info-content">
                  <div className="info-label">Location</div>
                  <div className="info-value">{profileData.location}</div>
                </div>
              </div>
            )}

            {/* Bio */}
            {profileData.bio && (
              <div className="info-item bio-item">
                <div className="info-icon">📝</div>
                <div className="info-content">
                  <div className="info-label">About</div>
                  <div className="info-value bio-value">{profileData.bio}</div>
                </div>
              </div>
            )}

            {/* Show message if no additional info is available */}
            {!profileData.phone && !profileData.job && !profileData.location && !profileData.bio && (
              <div className="no-info">
                <p>This person hasn't added additional profile information yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Not connected message */}
        {!profileData.is_connected && !profileData.is_own_profile && (
          <div className="not-connected-info">
            <div className="info-icon">🔒</div>
            <h3>Profile Privacy</h3>
            <p>This person's detailed information is private. Connect with them to see more details about their profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewProfile;
