import React, { useEffect, useState } from 'react';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const email = localStorage.getItem("loggedInEmail");

  useEffect(() => {
    if (email) {
      fetch("http://127.0.0.1:5000/users")
        .then(res => res.json())
        .then(data => {
          const found = data.find(u => u.email === email);
          setUser(found);
        });
    }
  }, [email]);

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
        <img src={user.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt="Profile" className="profile-pic" />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    </div>
  );
}
export default Profile;
