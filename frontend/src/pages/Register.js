import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, MapPin, Phone, ArrowRight, Eye, EyeOff, Sparkles, Shield,
  CheckCircle, XCircle, AlertCircle, Loader2, GraduationCap, Rocket, Star,
  Users, BookOpen, Zap, Award, Check, ChevronRight, Info, Chrome, Github,
  TrendingUp, Target, Brain
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', full_name: '', location: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordByteLength, setPasswordByteLength] = useState(0);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mouse tracking
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

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Password validation
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      setPasswordByteLength(0);
      return;
    }
    const byteLen = new TextEncoder().encode(formData.password).length;
    setPasswordByteLength(byteLen);

    if (formData.password.length < 8) {
      setPasswordStrength(25);
    } else {
      let strength = 50;
      if (/[A-Z]/.test(formData.password)) strength += 25;
      if (/[0-9]/.test(formData.password)) strength += 25;
      setPasswordStrength(Math.min(strength, 100));
    }
  }, [formData.password]);

  // Username availability
  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(() => {
      const taken = ['admin', 'test', 'user'].includes(formData.username.toLowerCase());
      setUsernameAvailable(!taken);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !/S+@S+.S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    const byteLength = new TextEncoder().encode(formData.password).length;
    if (byteLength > 72) {
      setError('Password is too long. Maximum 72 characters allowed.');
      return false;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await register(formData);
    if (result.success) {
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const getPasswordStrengthColor = () => {
    if (passwordByteLength > 72) return 'bg-red-500';
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordByteLength > 72) return 'Too Long';
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const steps = [
    { number: 1, title: 'Account', icon: Mail, desc: 'Create your account' },
    { number: 2, title: 'Profile', icon: User, desc: 'Tell us about you' },
    { number: 3, title: 'Complete', icon: Rocket, desc: 'Start learning' },
  ];

  const benefits = [
    { icon: Brain, text: 'AI-powered learning paths', color: 'from-cyan-400 to-blue-500' },
    { icon: Users, text: 'Connect with 10K+ learners', color: 'from-purple-400 to-pink-500' },
    { icon: Target, text: 'Achieve your goals faster', color: 'from-emerald-400 to-green-500' },
    { icon: Award, text: 'Earn verified certificates', color: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, #0a0118 0%, #10061d 25%, #03010b 50%, #1a0b2e 75%, #0a0118 100%)
          `,
        }}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-slow"></div>
        </div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Particles */}
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
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full border-4 border-indigo-950 animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  TalentConnect
                </h1>
                <p className="text-indigo-300 font-semibold text-sm">AI-Powered Learning Platform</p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-sm font-bold">Join 10,000+ Students</span>
              </div>
              <h2 className="text-6xl font-black leading-tight">
                Start Your
                <span className="block mt-2 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient-x">
                  Learning Journey
                </span>
              </h2>
              <p className="text-xl text-indigo-200 leading-relaxed">
                Transform your skills with AI-powered learning paths, expert mentors, and a supportive community.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index} 
                    className="group p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`inline-flex p-3 bg-gradient-to-br ${benefit.color} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-indigo-100 font-semibold group-hover:text-white transition-colors">{benefit.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-8 px-6 py-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="text-center">
                <div className="text-3xl font-black text-white">10K+</div>
                <div className="text-xs text-indigo-300 font-semibold">Active Users</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">500+</div>
                <div className="text-xs text-indigo-300 font-semibold">Skills</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-white">4.8</div>
                <div className="text-xs text-indigo-300 font-semibold">Rating</div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="relative animate-slide-in-right">
            {/* Decorative Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"></div>

            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-10 hover:shadow-cyan-500/20 transition-shadow duration-500" data-testid="register-form-container">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/30 rounded-full mb-6 backdrop-blur-xl">
                  <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span className="text-transparent bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text font-bold">Free Forever</span>
                  <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
                </div>
                
                <h2 className="text-4xl font-black text-white mb-3">
                  Create Account
                </h2>
                <p className="text-indigo-200 text-lg">
                  Join thousands of learners today
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-10">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep >= step.number;
                  const isCompleted = currentStep > step.number;
                  return (
                    <React.Fragment key={step.number}>
                      <div className="relative flex flex-col items-center">
                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                          isActive
                            ? 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/50'
                            : 'bg-white/10 border-2 border-white/20'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-7 h-7 text-white" />
                          ) : (
                            <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                          )}
                          {isActive && !isCompleted && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 animate-ping opacity-50"></div>
                          )}
                        </div>
                        <p className={`mt-3 text-xs font-bold ${isActive ? 'text-white' : 'text-indigo-400'}`}>
                          {step.title}
                        </p>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                          currentStep > step.number ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : 'bg-white/20'
                        }`}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-200 animate-slide-down backdrop-blur-xl" data-testid="register-success">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 animate-pulse" />
                  <span className="font-semibold">{success}</span>
                  <div className="ml-auto w-5 h-5 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 animate-shake backdrop-blur-xl" data-testid="register-error">
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

              <form className="space-y-6" onSubmit={handleSubmit} data-testid="register-form">
                {/* Step 1: Account Info */}
                <div className={`space-y-6 transition-all ${currentStep === 1 ? 'block' : 'hidden'}`}>
                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-bold text-indigo-200 mb-3">
                      Email Address *
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
                      {formData.email && /S+@S+.S+/.test(formData.email) && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 animate-scale-in" />
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <label htmlFor="username" className="block text-sm font-bold text-indigo-200 mb-3">
                      Username *
                    </label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'username' ? 'text-cyan-400' : 'text-indigo-400'
                      }`} />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        data-testid="username-input"
                      />
                      {usernameAvailable !== null && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {usernameAvailable ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 animate-scale-in" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 animate-scale-in" />
                          )}
                        </div>
                      )}
                    </div>
                    {usernameAvailable === false && (
                      <p className="mt-2 text-xs text-red-400 font-semibold">Username is already taken</p>
                    )}
                    {usernameAvailable === true && (
                      <p className="mt-2 text-xs text-emerald-400 font-semibold">Username is available! ✓</p>
                    )}
                  </div>

                  <div className="group">
                    <label htmlFor="password" className="block text-sm font-bold text-indigo-200 mb-3">
                      Password *
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
                        maxLength={72}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                        placeholder="Create a strong password"
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

                    {formData.password && (
                      <div className="mt-3 space-y-3">
                        {passwordByteLength > 72 && (
                          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                            <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-xs text-red-300 font-semibold">
                              Password exceeds 72 bytes limit ({passwordByteLength} bytes)
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-indigo-300 font-semibold">Password Strength</span>
                            <span className={`text-xs font-bold ${
                              passwordByteLength > 72 ? 'text-red-400' :
                              passwordStrength <= 25 ? 'text-red-400' :
                              passwordStrength <= 50 ? 'text-orange-400' :
                              passwordStrength <= 75 ? 'text-yellow-400' :
                              'text-emerald-400'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                              style={{ width: `${passwordByteLength > 72 ? 100 : passwordStrength}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            {formData.password.length >= 8 ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-500" />
                            )}
                            <span className={formData.password.length >= 8 ? 'text-emerald-400' : 'text-gray-500'}>
                              8+ characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/[A-Z]/.test(formData.password) ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-500" />
                            )}
                            <span className={/[A-Z]/.test(formData.password) ? 'text-emerald-400' : 'text-gray-500'}>
                              Uppercase
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/[0-9]/.test(formData.password) ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-500" />
                            )}
                            <span className={/[0-9]/.test(formData.password) ? 'text-emerald-400' : 'text-gray-500'}>
                              Number
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordByteLength <= 72 ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className={passwordByteLength <= 72 ? 'text-emerald-400' : 'text-red-400'}>
                              ≤72 bytes
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Personal Info */}
                <div className={`space-y-6 transition-all ${currentStep === 2 ? 'block' : 'hidden'}`}>
                  <div className="group">
                    <label htmlFor="full_name" className="block text-sm font-bold text-indigo-200 mb-3">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'full_name' ? 'text-cyan-400' : 'text-indigo-400'
                      }`} />
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('full_name')}
                        onBlur={() => setFocusedField(null)}
                        data-testid="fullname-input"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="group">
                      <label htmlFor="location" className="block text-sm font-bold text-indigo-200 mb-3">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                          focusedField === 'location' ? 'text-cyan-400' : 'text-indigo-400'
                        }`} />
                        <input
                          id="location"
                          name="location"
                          type="text"
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                          placeholder="New York, USA"
                          value={formData.location}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('location')}
                          onBlur={() => setFocusedField(null)}
                          data-testid="location-input"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label htmlFor="phone" className="block text-sm font-bold text-indigo-200 mb-3">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                          focusedField === 'phone' ? 'text-cyan-400' : 'text-indigo-400'
                        }`} />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border-2 border-white/20 rounded-2xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all backdrop-blur-xl font-semibold"
                          placeholder="+1 234 567 8900"
                          value={formData.phone}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField(null)}
                          data-testid="phone-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Confirmation */}
                <div className={`space-y-6 transition-all ${currentStep === 3 ? 'block' : 'hidden'}`}>
                  <div className="text-center py-8">
                    <div className="relative inline-flex mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-2xl opacity-75 animate-pulse-soft"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl">
                        <Rocket className="w-12 h-12 text-white animate-bounce-subtle" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">Almost There!</h3>
                    <p className="text-indigo-200 text-lg mb-8">
                      Review your information and let's get started
                    </p>

                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 text-left border border-white/10">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                          <span className="text-sm text-indigo-300 font-semibold">Email</span>
                          <span className="text-sm text-white font-bold">{formData.email}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                          <span className="text-sm text-indigo-300 font-semibold">Username</span>
                          <span className="text-sm text-white font-bold">@{formData.username}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/10">
                          <span className="text-sm text-indigo-300 font-semibold">Full Name</span>
                          <span className="text-sm text-white font-bold">{formData.full_name || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-indigo-300 font-semibold">Password</span>
                          <span className="text-sm text-emerald-400 font-bold flex items-center gap-2">
                            {getPasswordStrengthText()}
                            <CheckCircle className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-4 cursor-pointer group p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded-lg border-2 border-white/20 bg-white/5 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 transition-all"
                    />
                    <span className="text-sm text-indigo-200 group-hover:text-white transition-colors leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text hover:from-cyan-300 hover:to-purple-300">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text hover:from-cyan-300 hover:to-purple-300">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex-1 py-4 px-6 bg-white/5 border-2 border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-xl"
                    >
                      Back
                    </button>
                  )}
                  
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="flex-1 group relative overflow-hidden py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all transform hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative flex items-center justify-center gap-2">
                        Continue
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !agreeTerms || passwordByteLength > 72}
                      className="flex-1 group relative overflow-hidden py-4 px-6 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                      data-testid="register-submit-button"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {loading ? (
                        <span className="relative flex items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-lg">Creating Account...</span>
                        </span>
                      ) : (
                        <span className="relative flex items-center justify-center gap-3">
                          <Rocket className="w-6 h-6" />
                          <span className="text-lg">Start Learning</span>
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Social Registration - Only on Step 1 */}
                {currentStep === 1 && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-transparent text-indigo-300 font-semibold">
                          Or sign up with
                        </span>
                      </div>
                    </div>

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
                  </>
                )}

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-indigo-200">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text hover:from-cyan-300 hover:to-purple-300 transition-all"
                      data-testid="login-link"
                    >
                      Sign in here →
                    </Link>
                  </p>
                </div>
              </form>

              {/* Trust Badge */}
              <div className="mt-8 flex items-center justify-center gap-3 text-xs text-indigo-300 bg-white/5 backdrop-blur-xl py-3 px-4 rounded-xl border border-white/10">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">256-bit SSL Encryption • Your data is safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-30px) translateX(20px); }
          66% { transform: translateY(15px) translateX(-20px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes gradient-slow {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-gradient-slow { animation: gradient-slow 20s linear infinite; }
        .animate-slide-in-left { animation: slide-in-left 0.8s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out; }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Register;