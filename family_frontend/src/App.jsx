import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Register from './Register';
import Login from './Login';
import Profile from './Profile';
import ViewProfile from './ViewProfile';
import Requests from './Requests';
import MyRelationships from './MyRelationships';
import './App.css';

function Menu({ loggedIn, onLogout }) {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  const fetchPendingRequests = async () => {
    try {
      const email = localStorage.getItem('loggedInEmail');
      setDebugInfo(`Checking requests for: ${email}`);

      if (!email) {
        setDebugInfo('No email found');
        return;
      }

      // Get current user
      const usersRes = await fetch('http://127.0.0.1:5000/users');
      if (!usersRes.ok) {
        setDebugInfo(`Users API failed: ${usersRes.status}`);
        return;
      }
      const users = await usersRes.json();
      const user = users.find(u => u.email === email);

      if (!user) {
        setDebugInfo('User not found in database');
        return;
      }
      setCurrentUser(user);

      // Get pending requests for this user using the correct endpoint
      const requestsRes = await fetch(`http://127.0.0.1:5000/relationship_requests/${user.id}`);
      if (!requestsRes.ok) {
        setDebugInfo(`Requests API failed: ${requestsRes.status}`);
        return;
      }
      const pendingRequests = await requestsRes.json();

      setPendingRequestsCount(pendingRequests.length);
      setDebugInfo(`Found ${pendingRequests.length} pending requests`);

    } catch (error) {
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!loggedIn) {
      setPendingRequestsCount(0);
      setDebugInfo('Not logged in');
      return;
    }

    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 30000);

    // Listen for request updates
    const handleRequestUpdate = () => {
      fetchPendingRequests();
    };

    window.addEventListener('requestHandled', handleRequestUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('requestHandled', handleRequestUpdate);
    };
  }, [loggedIn]);

  return (
    <nav className="top-menu">
      <div className="menu-left">
        👨‍👩‍👧‍👦 Family App
        {/* Debug info - remove this after testing */}
        <span style={{fontSize: '0.8rem', color: '#666', marginLeft: '1rem'}}>
          ({debugInfo})
        </span>
      </div>
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
            <div className="menu-link-wrapper">
              <Link to="/requests" className="menu-link">
                Requests
                {pendingRequestsCount > 0 && (
                  <span className="notification-badge">{pendingRequestsCount}</span>
                )}
              </Link>
            </div>
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
    <div className="page-card">
      <h2 style={{ color: '#2d3748', marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '700' }}>
        🔍 Find People
      </h2>

      <form onSubmit={handleSearch} className="form-group">
        <label className="form-label">Search for family and friends</label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter email address or phone number"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="search-results">
          <h3>Found {results.length} user{results.length !== 1 ? 's' : ''}:</h3>
          {results.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">What is {user.name} to you?</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., friend, cousin, sibling"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => handleConnect(user.id)}
                  className="btn-secondary"
                  type="button"
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className={`form-message ${message.includes('sent') ? 'success' : message.includes('Failed') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}
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
          <Route path="/profile/:userId" element={<ViewProfile />} />
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
