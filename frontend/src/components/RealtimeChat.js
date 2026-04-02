import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, MessageCircle, X } from 'lucide-react';
import api from '../services/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RealtimeChat = ({ roomType, roomId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('📱 Current user from localStorage:', user);
    setCurrentUser(user);
    
    // Load message history
    loadHistory();
    
    // Connect to WebSocket
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        console.log('🔌 Closing WebSocket connection');
        wsRef.current.close();
      }
    };
  }, [roomType, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      console.log('📜 Loading chat history for:', roomType, roomId);
      const response = await api.get(`/api/realtime/history/${roomType}/${roomId}`);
      console.log('📜 History loaded:', response.data);
      setMessages(response.data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      setLoading(false);
    }
  };

 const connectWebSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found for WebSocket connection');
    return;
  }

  // Debug logging
  console.log('BACKEND_URL from env:', BACKEND_URL);
  console.log('process.env.REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
  
  // Fallback to window.location if BACKEND_URL is not defined
  const backendUrl = BACKEND_URL || window.location.origin;
  console.log('Using backend URL:', backendUrl);
  
  const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
  const baseUrl = backendUrl.replace(/^https?:\/\//, '');
  const fullWsUrl = `${wsProtocol}://${baseUrl}/api/realtime/ws/${roomType}/${roomId}?token=${token}`;
  
  console.log('Connecting to WebSocket:', fullWsUrl);
  
  try {
    const ws = new WebSocket(fullWsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Received message:', message);
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected - Code:', event.code, 'Reason:', event.reason);
      setConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current === ws) {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }
      }, 3000);
    };

    wsRef.current = ws;
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error);
    setConnected(false);
  }
};
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send message - WebSocket not ready or empty message');
      return;
    }

    const messagePayload = {
      content: newMessage.trim(),
      message_type: 'text'
    };

    console.log('📤 Sending message:', messagePayload);
    wsRef.current.send(JSON.stringify(messagePayload));
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg" data-testid="realtime-chat">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {connected ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Disconnected
                </span>
              )}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === currentUser?.id;
            const isSystem = msg.message_type === 'system';
            
            console.log('🎨 Rendering message:', { 
              index, 
              isOwn, 
              isSystem, 
              sender_id: msg.sender_id, 
              current_user_id: currentUser?.id,
              content: msg.content 
            });

            if (isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    User {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={!connected}
            data-testid="chat-input"
          />
          <button
            type="submit"
            disabled={!connected || !newMessage.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            data-testid="send-message-btn"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealtimeChat;
