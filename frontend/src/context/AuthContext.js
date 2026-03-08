import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/apiService';

const AuthContext = createContext();

// This is already exporting useAuth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const token = response.access_token;
      
      localStorage.setItem('token', token);
      
      // Fetch user data
      const userData = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  // UPDATED register function with password truncation
  const register = async (userData) => {
    try {
      // Truncate password to 72 characters to avoid bcrypt error
      const processedUserData = {
        ...userData,
        password: userData.password.length > 72 
          ? userData.password.substring(0, 72) 
          : userData.password
      };
      
      const response = await authService.register(processedUserData);
      const token = response.access_token;
      
      localStorage.setItem('token', token);
      
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle bcrypt error specifically
      if (error.response?.data?.detail?.includes('72 bytes')) {
        return { 
          success: false, 
          error: 'Password is too long. Please use a shorter password (max 72 characters).' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ REMOVE THIS LINE - it's causing the duplicate export error
// export { useAuth, AuthProvider };