import React, { useEffect, useState } from 'react';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({});
  const email = localStorage.getItem("loggedInEmail");

  const fetchUserData = async () => {
    if (email) {
      try {
        console.log('Fetching user data from backend...');
        const response = await fetch("http://127.0.0.1:5000/users");
        const data = await response.json();
        const found = data.find(u => u.email === email);
        console.log('User data from backend:', found);
        if (found) {
          setUser(found);
          setFormData({
            name: found.name || '',
            phone: found.phone || '',
            job: found.job || '',
            bio: found.bio || '',
            location: found.location || '',
            phone_private: found.phone_private || false,
            job_private: found.job_private || false,
            bio_private: found.bio_private || false,
            location_private: found.location_private || false
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [email]);

  // Only fetch user data when exiting edit mode (not when profile pic is uploaded)
  useEffect(() => {
    if (!isEditing && !uploading) {
      fetchUserData();
    }
  }, [isEditing]);

  const handleCameraClick = () => {
    document.getElementById('profile-pic-input').click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setMessage('');

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
        setTimeout(() => {
          handleUpload(file);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (fileToUpload = selectedFile) => {
    if (!fileToUpload || !user) return;

    setUploading(true);
    setMessage('Uploading...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;

        const response = await fetch(`http://127.0.0.1:5000/update_profile/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_pic: base64Image })
        });

        if (response.ok) {
          // Update user state first
          const updatedUser = {...user, profile_pic: base64Image};
          setUser(updatedUser);
          // Clear preview after user is updated so the saved image shows
          setPreviewUrl(null);
          setMessage('Profile picture updated successfully!');
          setSelectedFile(null);
          setTimeout(() => setMessage(''), 3000);
        } else {
          setMessage('Failed to update profile picture');
        }
        setUploading(false);
      };
      reader.readAsDataURL(fileToUpload);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading image');
      setUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacyToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      [`${field}_private`]: !prev[`${field}_private`]
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/update_profile/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        fetchUserData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('Error updating profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      job: user.job || '',
      bio: user.bio || '',
      location: user.location || '',
      phone_private: user.phone_private || false,
      job_private: user.job_private || false,
      bio_private: user.bio_private || false,
      location_private: user.location_private || false
    });
  };

  if (!user) return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Loading profile...</h2>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Picture Section */}
        <div className="profile-pic-section">
          <img
            src={previewUrl || user.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'}
            alt="Profile"
            className="profile-pic"
          />
          <button
            className="edit-pic-btn"
            onClick={handleCameraClick}
            title="Change profile picture"
          >
            📸
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
          id="profile-pic-input"
          style={{ display: 'none' }}
        />

        {/* Profile Header */}
        <div className="profile-header">
          <h2>{user.name}</h2>
          <p className="profile-subtitle">{user.email}</p>
          <button
            className="edit-profile-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '✏️ Editing' : '✏️ Edit Profile'}
          </button>
        </div>

        {/* Profile Information */}
        <div className="profile-info">
          {/* Phone */}
          <div className="info-item">
            <div className="info-icon">📞</div>
            <div className="info-content">
              <div className="info-label">Phone Number</div>
              {isEditing ? (
                <div className="edit-field">
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                  <button
                    className={`privacy-btn ${formData.phone_private ? 'private' : 'public'}`}
                    onClick={() => handlePrivacyToggle('phone')}
                    title={formData.phone_private ? 'Private (only you can see)' : 'Public (everyone can see)'}
                  >
                    {formData.phone_private ? '🔒' : '🌍'}
                  </button>
                </div>
              ) : (
                <div className="info-value">
                  {user.phone || 'Not provided'}
                  {user.phone_private && <span className="privacy-indicator">🔒</span>}
                </div>
              )}
            </div>
          </div>

          {/* Job */}
          <div className="info-item">
            <div className="info-icon">💼</div>
            <div className="info-content">
              <div className="info-label">Job / Occupation</div>
              {isEditing ? (
                <div className="edit-field">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Software Engineer, Student, Teacher"
                    value={formData.job}
                    onChange={(e) => handleInputChange('job', e.target.value)}
                  />
                  <button
                    className={`privacy-btn ${formData.job_private ? 'private' : 'public'}`}
                    onClick={() => handlePrivacyToggle('job')}
                    title={formData.job_private ? 'Private (only you can see)' : 'Public (everyone can see)'}
                  >
                    {formData.job_private ? '🔒' : '🌍'}
                  </button>
                </div>
              ) : (
                <div className="info-value">
                  {user.job || 'Not provided'}
                  {user.job_private && <span className="privacy-indicator">🔒</span>}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="info-item">
            <div className="info-icon">📍</div>
            <div className="info-content">
              <div className="info-label">Location</div>
              {isEditing ? (
                <div className="edit-field">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., London, UK or New York, USA"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                  <button
                    className={`privacy-btn ${formData.location_private ? 'private' : 'public'}`}
                    onClick={() => handlePrivacyToggle('location')}
                    title={formData.location_private ? 'Private (only you can see)' : 'Public (everyone can see)'}
                  >
                    {formData.location_private ? '🔒' : '🌍'}
                  </button>
                </div>
              ) : (
                <div className="info-value">
                  {user.location || 'Not provided'}
                  {user.location_private && <span className="privacy-indicator">🔒</span>}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="info-item bio-item">
            <div className="info-icon">📝</div>
            <div className="info-content">
              <div className="info-label">About Me</div>
              {isEditing ? (
                <div className="edit-field">
                  <textarea
                    className="form-input bio-textarea"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows="3"
                  />
                  <button
                    className={`privacy-btn ${formData.bio_private ? 'private' : 'public'}`}
                    onClick={() => handlePrivacyToggle('bio')}
                    title={formData.bio_private ? 'Private (only you can see)' : 'Public (everyone can see)'}
                  >
                    {formData.bio_private ? '🔒' : '🌍'}
                  </button>
                </div>
              ) : (
                <div className="info-value bio-value">
                  {user.bio || 'No bio provided'}
                  {user.bio_private && <span className="privacy-indicator">🔒</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="edit-actions">
            <button className="btn-primary" onClick={handleSave}>
              💾 Save Changes
            </button>
            <button className="btn-secondary" onClick={handleCancel}>
              ❌ Cancel
            </button>
          </div>
        )}

        {message && (
          <div className={`form-message ${message.includes('successfully') ? 'success' : message.includes('Failed') || message.includes('Error') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
