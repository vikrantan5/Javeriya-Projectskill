import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Sparkles,
  Shield,
  Github,
  Twitter,
  Facebook,
  Loader2,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Bot,
  BookOpen,
  Users
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
 // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Check for saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await login(formData);
    
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setError(result.error || 'Invalid email or password');
    }
    
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    setLoading(true);
    // Implement social login logic here
    console.log(`Logging in with ${provider}`);
    setTimeout(() => setLoading(false), 1000);
  };

  const quickTips = [
    { icon: Bot, text: 'AI-powered recommendations' },
    { icon: BookOpen, text: 'Personalized learning paths' },
    { icon: Users, text: 'Connect with mentors' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-spin-slow"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-indigo-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-purple-400 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-40 right-40 w-2 h-2 bg-pink-400 rounded-full animate-ping animation-delay-2000"></div>
      </div>

      <div className="relative max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-2xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full border-4 border-indigo-900 animate-pulse"></div>
            </div>
            <span className="text-3xl font-bold">TalentConnect</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Welcome Back to
            <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Your Learning Journey
            </span>
          </h1>

          <p className="text-xl text-indigo-200 max-w-lg">
            Continue where you left off and unlock new opportunities with AI-powered learning.
          </p>

          {/* Quick Tips */}
          <div className="space-y-4 mt-12">
            {quickTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="p-2 bg-indigo-500/30 rounded-lg">
                    <Icon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <span className="text-indigo-100">{tip.text}</span>
                  <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-indigo-200 text-sm">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-indigo-200 text-sm">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.8</div>
              <div className="text-indigo-200 text-sm">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse animation-delay-2000"></div>

          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20" data-testid="login-form-container">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-200 px-4 py-2 rounded-full mb-4 border border-indigo-400/30">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Login</span>
                <Shield className="w-4 h-4" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-indigo-200">
                Sign in to continue your learning journey
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-200 animate-slide-down" data-testid="login-success">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{successMessage}</span>
                <div className="ml-auto w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 animate-shake" data-testid="login-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="ml-auto hover:text-red-100 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} data-testid="login-form">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      data-testid="email-input"
                    />
                    {formData.email && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-indigo-200 group-hover:text-indigo-100 transition-colors">
                    Remember me
                  </span>
                </label>
                
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/25"
                data-testid="login-submit-button"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>

              {/* Social Login */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-indigo-200">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { provider: 'Google', icon: Github, color: 'hover:bg-orange-500/20' },
                  { provider: 'GitHub', icon: Github, color: 'hover:bg-gray-500/20' },
                  { provider: 'Twitter', icon: Twitter, color: 'hover:bg-blue-500/20' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSocialLogin(item.provider)}
                      disabled={loading}
                      className={`flex items-center justify-center px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all ${item.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-indigo-200">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="font-medium text-white hover:text-indigo-200 transition-colors underline decoration-indigo-400/50 hover:decoration-indigo-300"
                    data-testid="register-link"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-indigo-300">
              <Shield className="w-4 h-4" />
              <span>Your data is protected with enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default Login;