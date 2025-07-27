import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Register from './Register';
import Login from './Login';
import Profile from './Profile';
import Requests from './Requests';
import MyRelationships from './MyRelationships';
import './App.css';

function Menu({ loggedIn, onLogout }) {
  return (
    <nav className="top-menu">
      <div className="menu-left">👨‍👩‍👧‍👦 Family App</div>
      <div className="menu-right">
        {!loggedIn ? (
          <>
            <Link to="/register" className="menu-link">Register</Link>
            <Link to="/login" className="menu-link">Login</Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="menu-link">Profile</Link>
            <Link to="/find" className="menu-link">Find People</Link>
            <Link to="/requests" className="menu-link">Requests</Link>
            <Link to="/relationships" className="menu-link">My Relationships</Link>
            <button className="menu-link logout-btn" onClick={onLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

function FindPeople() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('loggedInEmail');
    if (email) {
      fetch('http://127.0.0.1:5000/users')
        .then(res => res.json())
        .then(users => {
          const user = users.find(u => u.email === email);
          setCurrentUser(user);
        });
    }
  }, []);

  const handleSearch = async e => {
    e.preventDefault();
    setMessage('');
    setResults([]);
    if (!query) return;
    const res = await fetch('http://127.0.0.1:5000/users');
    const users = await res.json();
    const found = users.filter(u => u.email === query || (u.phone && u.phone === query));
    setResults(found);
    if (found.length === 0) setMessage('No user found.');
  };

  const handleConnect = async (toUserId) => {
    if (!relationship) {
      setMessage('Please select a relationship type.');
      return;
    }
    const res = await fetch('http://127.0.0.1:5000/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_user_id: currentUser.id,
        to_user_id: toUserId,
        relationship_type: relationship
      })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Connection request sent! The user must accept your request.');
    } else {
      setMessage(data.error || 'Failed to send request.');
    }
  };

  return (
    <div className="auth-form">
      <h2>Find People</h2>
      <form onSubmit={handleSearch} style={{marginBottom: '1.2rem'}}>
        <input
          type="text"
          placeholder="Search by email or phone number"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {results.length > 0 && (
        <div style={{width: '100%'}}>
          <h3>Results:</h3>
          {results.map(user => (
            <div key={user.id} style={{marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem'}}>
              <div><b>{user.name}</b> ({user.email})</div>
              <div style={{marginTop: '0.5rem'}}>
                <input
                  type="text"
                  placeholder="Relationship (e.g. friend, cousin)"
                  value={relationship}
                  onChange={e => setRelationship(e.target.value)}
                  style={{marginRight: '0.7rem'}}
                />
                <button onClick={() => handleConnect(user.id)} type="button">Connect</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {message && <div className="form-message">{message}</div>}
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('loggedInEmail'));
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('loggedInEmail'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedInEmail');
    setLoggedIn(false);
    navigate('/login');
  };

  return (
    <div className="app-bg">
      <Menu loggedIn={loggedIn} onLogout={handleLogout} />
      <div className="app-container">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLogin={() => { setLoggedIn(true); navigate('/profile'); }} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/find" element={<FindPeople />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/relationships" element={<MyRelationships />} />
          <Route path="/" element={<Login onLogin={() => { setLoggedIn(true); navigate('/profile'); }} />} />
        </Routes>
      </div>
    </div>
  );
}

export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
