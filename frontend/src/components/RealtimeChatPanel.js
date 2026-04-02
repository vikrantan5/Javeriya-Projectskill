import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, Wifi, WifiOff } from 'lucide-react';
import { realtimeService } from '../services/apiService';

const RealtimeChatPanel = ({ roomType, roomId, currentUserId, title = 'Realtime Chat' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  const token = useMemo(() => localStorage.getItem('token'), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!roomType || !roomId || !token) return undefined;

    let isMounted = true;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await realtimeService.getHistory(roomType, roomId);
        if (!isMounted) return;
        setMessages(response.messages || []);
      } catch (error) {
        if (!isMounted) return;
        setConnectionError(error?.response?.data?.detail || 'Unable to load chat history');
      }
      setLoadingHistory(false);
    };

    const connect = () => {
      try {
        const wsUrl = realtimeService.buildWebSocketUrl(roomType, roomId, token);
        console.log('🔌 RealtimeChatPanel connecting to:', wsUrl);
        console.log('   Room Type:', roomType, 'Room ID:', roomId);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('✅ RealtimeChatPanel WebSocket connected');
          setConnected(true);
          setConnectionError('');
        };

        ws.onclose = (event) => {
          if (!isMounted) return;
          console.log('🔌 RealtimeChatPanel WebSocket closed - Code:', event.code, 'Reason:', event.reason);
          setConnected(false);
        };

        ws.onerror = (error) => {
          if (!isMounted) return;
          console.error('❌ RealtimeChatPanel WebSocket error:', error);
          setConnectionError('Live chat connection failed');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            console.log('📨 RealtimeChatPanel received:', payload);
            if (payload?.event === 'error') {
              setConnectionError(payload?.detail || 'Realtime message error');
              return;
            }
            setMessages((prev) => [...prev, payload]);
          } catch (_err) {
            console.error('Failed to parse message:', _err);
          }
        };
      } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
        setConnectionError('Unable to initialize live chat');
      }
    };

    loadHistory();
    connect();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomType, roomId, token]);

  const handleSend = () => {
    const safeContent = input.trim();
    if (!safeContent || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        content: safeContent,
        message_type: 'text',
      })
    );
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" data-testid="realtime-chat-panel">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between" data-testid="realtime-chat-header">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white" data-testid="realtime-chat-title">{title}</h4>
          <p className="text-xs text-gray-500" data-testid="realtime-chat-room-label">{roomType}:{String(roomId).slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-1 text-xs" data-testid="realtime-connection-status">
          {connected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          <span className={connected ? 'text-green-600' : 'text-red-600'}>{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {connectionError && (
        <div className="px-4 py-2 text-xs bg-red-50 text-red-600 border-b border-red-100" data-testid="realtime-chat-error">
          {connectionError}
        </div>
      )}

      <div className="h-64 overflow-y-auto p-4 space-y-3" data-testid="realtime-chat-messages">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8" data-testid="realtime-chat-loading">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8" data-testid="realtime-chat-empty">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((message, index) => {
            const isMine = message.sender_id === currentUserId;
            const isSystem = message.message_type === 'system';

            if (isSystem) {
              return (
                <div key={message.id || index} className="text-center" data-testid="realtime-system-message">
                  <span className="text-xs text-gray-400">{message.sender_id?.slice(0, 6)} {message.content}</span>
                </div>
              );
            }

            return (
              <div key={message.id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} data-testid="realtime-chat-message-item">
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                  <p className="text-sm whitespace-pre-wrap" data-testid="realtime-chat-message-content">{message.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-100' : 'text-gray-400'}`} data-testid="realtime-chat-message-time">
                    {message.created_at ? new Date(message.created_at).toLocaleTimeString() : 'now'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2" data-testid="realtime-chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
          data-testid="realtime-chat-input"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          className="h-10 px-4 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          data-testid="realtime-chat-send-button"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
};

export default RealtimeChatPanel;