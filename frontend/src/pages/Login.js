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
  Loader2,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Bot,
  BookOpen,
  Users,
  Zap,
  Star,
  TrendingUp,
  Award,
  Chrome,
  Github
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100, 
        y: (e.clientY / window.innerHeight) * 100 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const stats = [
    { icon: Users, label: 'Active Learners', value: '10K+', color: 'from-cyan-400 to-blue-500' },
    { icon: BookOpen, label: 'Skills Available', value: '500+', color: 'from-purple-400 to-pink-500' },
    { icon: Award, label: 'Success Rate', value: '98%', color: 'from-emerald-400 to-green-500' },
  ];

  const features = [
    { icon: Bot, text: 'AI-powered recommendations', color: 'cyan' },
    { icon: Zap, text: 'Instant skill matching', color: 'purple' },
    { icon: Star, text: '4.8/5 user rating', color: 'yellow' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a0118 0%, #0e0716 25%, #050212 50%, #1a0b2e 75%, #0a0118 100%)
          `,
        }}
      >
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-800/20 via-purple-800/20 to-teal-500/20 animate-gradient-slow"></div>
        </div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Particle Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block text-white space-y-8 animate-slide-in-left">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-fuchsia-500 to-indigo-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-400 via-red-400 to-yellow-400 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full border-4 border-indigo-950 animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-br from-amber-400 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">
                  TalentConnect
                </h1>
                <p className="text-indigo-300 font-semibold text-sm">AI-Powered Learning Platform</p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 text-sm font-bold">Trusted by 10,000+ Students</span>
              </div>
              <h2 className="text-6xl font-black leading-tight">
                Welcome Back to
                <span className="block mt-2 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient-x">
                  Your Journey
                </span>
              </h2>
              <p className="text-xl text-indigo-200 leading-relaxed">
                Continue learning, growing, and connecting with the world's most intelligent peer learning community.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className="group flex items-center gap-4 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 transform hover:translate-x-2"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`p-3 bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/20 rounded-xl border border-${feature.color}-500/30`}>
                      <Icon className={`w-6 h-6 text-${feature.color}-400`} />
                    </div>
                    <span className="text-indigo-100 font-semibold group-hover:text-white transition-colors">{feature.text}</span>
                    <CheckCircle className="w-5 h-5 text-emerald-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all group">
                    <div className={`inline-flex p-3 bg-gradient-to-br ${stat.color} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-indigo-300 font-semibold">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="relative animate-slide-in-right">
            {/* Decorative Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"></div>

            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-10 hover:shadow-cyan-500/20 transition-shadow duration-500" data-testid="login-form-container">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/30 rounded-full mb-6 backdrop-blur-xl">
                  <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span className="text-transparent bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text font-bold">Secure Authentication</span>
                  <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
                </div>
                
                <h2 className="text-4xl font-black text-white mb-3">
                  Welcome Back
                </h2>
                <p className="text-indigo-200 text-lg">
                  Sign in to continue your learning journey
                </p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-200 animate-slide-down backdrop-blur-xl" data-testid="login-success">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 animate-pulse" />
                  <span className="font-semibold">{successMessage}</span>
                  <div className="ml-auto w-5 h-5 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 animate-shake backdrop-blur-xl" data-testid="login-error">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <span className="font-semibold">{error}</span>
                  <button 
                    onClick={() => setError('')}
                    className="ml-auto text-2xl hover:text-red-100 transition-colors leading-none"
                  >
                    ×
                  </button>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit} data-testid="login-form">
                {/* Email Field */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-bold text-indigo-200 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === 'email' ? 'text-cyan-400' : 'text-indigo-400'
                    }`} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      data-testid="email-input"
                    />
                    {formData.email && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-scale-in" />
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-bold text-indigo-200 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === 'password' ? 'text-cyan-400' : 'text-indigo-400'
                    }`} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-cyan-400 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-2 border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 transition-all"
                    />
                    <span className="text-sm text-indigo-200 group-hover:text-white transition-colors font-semibold">
                      Remember me
                    </span>
                  </label>
                  
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text hover:from-cyan-300 hover:to-purple-300 transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-4 px-6 bg-gradient-to-br from-amber-400 via-fuchsia-500 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] overflow-hidden"
                  data-testid="login-submit-button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-fuchsia-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {loading ? (
                    <span className="relative flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-lg">Signing in...</span>
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-3">
                      <span className="text-lg">Sign In</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-indigo-300 font-semibold">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border-2 border-white/20 rounded-2xl text-white hover:bg-white/10 hover:border-cyan-500/40 transition-all backdrop-blur-xl group"
                  >
                    <Chrome className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Google</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border-2 border-white/20 rounded-2xl text-white hover:bg-white/10 hover:border-purple-500/40 transition-all backdrop-blur-xl group"
                  >
                    <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">GitHub</span>
                  </button>
                </div>

                {/* Register Link */}
                <div className="text-center pt-4">
                  <p className="text-indigo-200">
                    Don't have an account?{' '}
                    <Link 
                      to="/register" 
                      className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text hover:from-cyan-300 hover:to-purple-300 transition-all"
                      data-testid="register-link"
                    >
                      Create one now →
                    </Link>
                  </p>
                </div>
              </form>

              {/* Trust Badge */}
              <div className="mt-8 flex items-center justify-center gap-3 text-xs text-indigo-300 bg-white/5 backdrop-blur-xl py-3 px-4 rounded-xl border border-white/10">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">256-bit SSL Encryption • Your data is safe with us</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-30px) translateX(20px);
          }
          66% {
            transform: translateY(15px) translateX(-20px);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes gradient-slow {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
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
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        .animate-gradient-slow {
          animation: gradient-slow 20s linear infinite;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;