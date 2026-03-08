import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-2xl font-bold text-indigo-600" data-testid="nav-logo">
              TalentConnect
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/dashboard')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Link>
              
              <Link
                to="/skills"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/skills')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                data-testid="nav-skills"
              >
                Skills
              </Link>
              
              <Link
                to="/tasks"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/tasks')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                data-testid="nav-tasks"
              >
                Tasks
              </Link>
              
              <Link
                to="/sessions"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/sessions')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                data-testid="nav-sessions"
              >
                Sessions
              </Link>
              
              <Link
                to="/chatbot"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/chatbot')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                data-testid="nav-chatbot"
              >
                AI Assistant
              </Link>
              
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/admin')
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid="nav-admin"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition"
              data-testid="nav-profile"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium hidden md:block">{user?.username}</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-red-600 font-medium transition"
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
