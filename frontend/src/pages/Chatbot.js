import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { aiService } from '../services/apiService';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Zap, 
  MessageSquare,
  ThumbsUp,
  Copy,
  RefreshCw,
  X,
  ChevronDown,
  HelpCircle,
  BookOpen,
  Code,
  Briefcase,
  Star
} from 'lucide-react';

// Helper function to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m TalentBot, your AI learning assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => generateUUID());
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [theme, setTheme] = useState('light');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setShowSuggestions(false);
    
    // Add user message
    setMessages((prev) => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date() 
    }]);
    
    setLoading(true);
    try {
      const response = await aiService.sendMessage(userMessage, sessionId);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: response.response,
        timestamp: new Date() 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          isError: true
        },
      ]);
    }
    setLoading(false);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  const handleNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Hi! I\'m TalentBot, your AI learning assistant. How can I help you today?',
      timestamp: new Date(),
    }]);
    setShowSuggestions(true);
  };

  const quickQuestions = [
    { icon: Code, text: 'How do I start learning DSA?', color: 'blue' },
    { icon: Briefcase, text: 'Recommend skills for web development', color: 'green' },
    { icon: HelpCircle, text: 'What is skill verification?', color: 'purple' },
    { icon: Star, text: 'How does the task marketplace work?', color: 'yellow' },
  ];

  const suggestions = [
    'Python for beginners',
    'Best frontend frameworks',
    'Machine learning roadmap',
    'Cloud computing basics',
    'System design interview',
    'DevOps best practices'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950" data-testid="chatbot-page">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      <Navbar />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Glass Effect */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-white">TalentBot</h1>
                  <span className="px-2 py-1 bg-indigo-500/30 text-indigo-200 text-xs rounded-full border border-indigo-400/30">
                    AI-Powered
                  </span>
                </div>
                <p className="text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your personalized AI learning assistant
                </p>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-300 border border-white/20"
            >
              <RefreshCw className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>

        {/* Main Chat Container */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span className="text-white font-medium">AI Conversation</span>
              <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                {sessionId.slice(0, 8)}...
              </span>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                data-testid={`message-${message.role}`}
              >
                <div className={`flex max-w-[80%] gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                      : 'bg-gradient-to-br from-gray-700 to-gray-900'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1">
                    <div
                      className={`relative group rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : message.isError
                          ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                          : 'bg-gray-800/50 border border-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>
                      
                      {/* Message Actions */}
                      {message.role === 'assistant' && !message.isError && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button 
                            onClick={() => handleCopyMessage(message.content)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-white/10 rounded transition-colors">
                            <ThumbsUp className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    } text-gray-500`}>
                      {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Combined Suggestions Panel */}
          {showSuggestions && messages.length === 1 && (
            <div className="border-t border-white/10 bg-black/20 p-6">
              {/* Suggestions Chips */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Try these suggestions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(suggestion)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-all duration-300 border border-white/10 hover:border-indigo-500/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Questions Grid */}
              <div>
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-400" />
                  Popular questions:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickQuestions.map((q, index) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(q.text)}
                        className="group relative overflow-hidden p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-indigo-500/50 transition-all duration-300"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r from-${q.color}-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="relative text-center">
                          <Icon className={`w-6 h-6 mx-auto mb-2 text-${q.color}-400`} />
                          <p className="text-xs text-gray-300">{q.text}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-white/10 p-4 bg-black/20" data-testid="chat-form">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about learning..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={loading}
                  data-testid="chat-input"
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                data-testid="send-button"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'Instant Responses', desc: 'Get answers in real-time' },
            { icon: BookOpen, title: 'Personalized Learning', desc: 'Tailored to your goals' },
            { icon: Sparkles, title: '24/7 Availability', desc: 'Always here to help' },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                  <p className="text-gray-400 text-xs">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Chatbot;