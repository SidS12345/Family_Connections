import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const email = localStorage.getItem('loggedInEmail');
  const navigate = useNavigate();

  const fetchUserAndConversations = async () => {
    if (!email) return;

    try {
      // Get current user
      const usersRes = await fetch('http://127.0.0.1:5000/users');
      const users = await usersRes.json();
      const user = users.find(u => u.email === email);
      
      if (!user) return;
      
      // Check for updated profile picture in localStorage
      const storedProfilePic = localStorage.getItem(`profile_pic_${user.email}`);
      if (storedProfilePic) {
        user.profile_pic = storedProfilePic;
      }
      setCurrentUser(user);

      // Get conversations
      const conversationsRes = await fetch(`http://127.0.0.1:5000/conversations/${user.id}`);
      const conversationsData = await conversationsRes.json();
      setConversations(conversationsData);
    } catch (error) {
      setMessage('Error loading conversations');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndConversations();
  }, [email]);

  const handleStartChat = (userId, userName) => {
    navigate(`/chat/${userId}`, { state: { userName } });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!email) return null;

  if (loading) {
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
          Messages
        </h2>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-loading 1.5s ease-in-out infinite',
          margin: '2rem auto'
        }} />
      </div>
    );
  }

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
        Messages
      </h2>

      {message && (
        <div className={`form-message ${message.includes('Error') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      {conversations.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: 'rgba(203, 213, 224, 1)', 
          padding: '3rem 0' 
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            opacity: 0.6
          }}>💬</div>
          <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>No conversations yet</h3>
          <p>Start messaging your family connections!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/relationships')}
            style={{ marginTop: '1rem' }}
          >
            View Connections
          </button>
        </div>
      ) : (
        <div className="conversations-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conversations.map(conversation => (
            <div 
              key={conversation.user_id} 
              className="user-card conversation-card"
              style={{ 
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => handleStartChat(conversation.user_id, conversation.user_name)}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '0.5rem'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={conversation.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                    alt={conversation.user_name}
                    style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid rgba(102, 126, 234, 0.4)'
                    }}
                  />
                  {conversation.unread_count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)',
                      border: '2px solid rgba(26, 32, 44, 1)'
                    }}>
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      fontSize: '1.1rem', 
                      color: '#ffffff' 
                    }}>
                      {conversation.user_name}
                    </span>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      color: 'rgba(203, 213, 224, 0.8)' 
                    }}>
                      {formatTime(conversation.last_message_time)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: conversation.unread_count > 0 ? '#ffffff' : 'rgba(203, 213, 224, 0.8)',
                    fontWeight: conversation.unread_count > 0 ? '500' : '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conversation.is_last_message_from_me ? 'You: ' : ''}
                    {conversation.last_message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Messages;