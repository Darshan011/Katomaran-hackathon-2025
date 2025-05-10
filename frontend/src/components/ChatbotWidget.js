import React, { useState, useEffect, useRef } from 'react';
import './ChatbotWidget.css';

const ChatbotWidget = ({ isVisible }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      // Connect to WebSocket server
      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'response') {
          setMessages(prev => [...prev, { type: 'bot', content: data.message }]);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [isVisible]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !ws.current) return;

    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: inputMessage }]);

    // Send message to WebSocket server
    ws.current.send(JSON.stringify({
      type: 'query',
      message: inputMessage
    }));

    setInputMessage('');
  };

  if (!isVisible) return null;

  return (
    <div className={`chatbot-widget ${isOpen ? 'open' : ''}`}>
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : '💬'}
      </button>
      
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Face Recognition Assistant</h3>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.type === 'user' ? 'user' : 'bot'}`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about registered faces..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget; 