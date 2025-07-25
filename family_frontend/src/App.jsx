import { useEffect, useState } from 'react';

function App() {
  const [users, setUsers] = useState([]);
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', profile_pic: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginMessage, setLoginMessage] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState(localStorage.getItem("loggedInEmail"));
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (currentUserEmail) {
          const foundUser = data.find(u => u.email === currentUserEmail);
          if (foundUser) setCurrentUserId(foundUser.id);
        }
      });
  }, [currentUserEmail]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });
    const data = await res.json();
    alert(data.message || data.error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://127.0.0.1:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });
    const data = await res.json();

    if (res.ok) {
      setLoginMessage(data.message);
      localStorage.setItem("loggedInEmail", loginData.email);
      setCurrentUserEmail(loginData.email);
    } else {
      setLoginMessage(data.error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://127.0.0.1:5000/update_profile/${currentUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerData.name,
        profile_pic: registerData.profile_pic || ''
      }),
    });
    const data = await res.json();
    alert(data.message || data.error);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>👨‍👩‍👧‍👦 Family App</h1>

      {currentUserEmail && (
        <>
          <p>✅ Logged in as: {currentUserEmail}</p>
          <button onClick={() => {
            localStorage.removeItem("loggedInEmail");
            setCurrentUserEmail(null);
            setCurrentUserId(null);
            setLoginMessage('');
          }}>
            Logout
          </button>
        </>
      )}

      {!currentUserEmail && (
        <>
          <h2>🔐 Register</h2>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Name"
              value={registerData.name}
              onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={registerData.email}
              onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={registerData.password}
              onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
            />
            <button type="submit">Register</button>
          </form>

          <h2>🔑 Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button type="submit">Login</button>
          </form>
          <p>{loginMessage}</p>
        </>
      )}

      {currentUserId && (
        <div style={{ marginTop: "2rem" }}>
          <h2>📝 Edit Profile</h2>
          <form onSubmit={handleProfileUpdate}>
            <input
              type="text"
              placeholder="New Name"
              value={registerData.name}
              onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Profile Picture URL (optional)"
              value={registerData.profile_pic || ''}
              onChange={e => setRegisterData({ ...registerData, profile_pic: e.target.value })}
            />
            <button type="submit">Update Profile</button>
          </form>
        </div>
      )}

      <h2>👥 All Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> (ID: {user.id}) — {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
