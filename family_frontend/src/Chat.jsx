import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';

function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const email = localStorage.getItem('loggedInEmail');

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchUserAndMessages = async () => {
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

      // Get messages between users
      const messagesRes = await fetch(`http://127.0.0.1:5000/messages/${user.id}/${userId}`);
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setMessages(messagesData.messages);
        setOtherUser(messagesData.other_user);
      } else {
        setMessage('Error loading messages');
      }
    } catch (error) {
      setMessage('Error loading messages');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndMessages();
  }, [email, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !currentUser) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setSending(true);
    
    try {
      const res = await fetch('http://127.0.0.1:5000/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          recipient_id: parseInt(userId),
          content: messageText
        })
      });

      if (res.ok) {
        // Refresh messages
        await fetchUserAndMessages();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to send message');
        setNewMessage(messageText); // Restore message on error
      }
    } catch (error) {
      setMessage('Error sending message');
      setNewMessage(messageText); // Restore message on error
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  if (!email) return null;

  if (loading) {
    return (
      <div className="page-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/messages')}
            style={{ 
              padding: '0.5rem',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s ease-in-out infinite'
          }} />
          <div style={{
            width: '120px',
            height: '20px',
            borderRadius: '10px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s ease-in-out infinite'
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button
          className="btn-secondary"
          onClick={() => navigate('/messages')}
        >
          ←
        </button>

        {otherUser && (
          <>
            <img
              src={otherUser.profile_pic || 'https://randomuser.me/api/portraits/lego/1.jpg'}
              alt={otherUser.name}
            />
            <h2>{otherUser.name}</h2>
          </>
        )}
      </div>

      <div className="chat-messages">
        {message && (
          <div className={`form-message ${message.includes('Error') ? 'error' : 'info'}`} style={{margin: '0 0 1rem 0'}}>
            {message}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="empty-state">
            <div>💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const showDate =
                index === 0 ||
                formatMessageDate(messages[index - 1].timestamp) !== formatMessageDate(msg.timestamp);

              return (
                <div key={msg.id}>
                  {showDate && <div className="date-label">{formatMessageDate(msg.timestamp)}</div>}

                  <div className={`message-row ${msg.is_from_me ? 'me' : 'them'}`}>
                    <div className={`message-bubble ${msg.is_from_me ? 'me' : 'them'}`}>
                      <div className="message-content">{msg.content}</div>
                      <div className={`message-time ${msg.is_from_me ? 'right' : 'left'}`}>
                        {formatMessageTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="form-input"
            disabled={sending}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;