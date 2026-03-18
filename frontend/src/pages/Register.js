import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Github,
  Twitter,
  Facebook,
  GraduationCap,
  Rocket,
  Star,
  Users,
  BookOpen,
  Zap,
  Heart,
  Globe,
  Calendar,
  Award,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    location: '',
    phone: '',
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
  const [passwordError, setPasswordError] = useState('');
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

    // Simple password validation
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      setPasswordError('');
      setPasswordByteLength(0);
      return;
    }
    // Calculate byte length
    const byteLen = new TextEncoder().encode(formData.password).length;
    setPasswordByteLength(byteLen);

    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      setPasswordStrength(0);
    } else {
      setPasswordError('');
      setPasswordStrength(100);
    }
  }, [formData.password]);

  // Simulate username availability check
  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    const timer = setTimeout(() => {
      // Simulate API call
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
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    const byteLength = new TextEncoder().encode(formData.password).length;
    if (byteLength > 72) {
      setError('Password is too long. Maximum 72 characters allowed.');
      return false;
    }
    
    if (passwordStrength < 75 && passwordStrength > 0) {
      setError('Please choose a stronger password');
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
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API call
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
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordByteLength > 72) return 'Too Long';
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const steps = [
    { number: 1, title: 'Account', icon: Mail },
    { number: 2, title: 'Profile', icon: User },
    { number: 3, title: 'Complete', icon: Check },
  ];

  const benefits = [
    { icon: Star, text: 'AI-powered learning paths', color: 'yellow' },
    { icon: Users, text: 'Connect with mentors', color: 'blue' },
    { icon: BookOpen, text: 'Access to 1000+ skills', color: 'green' },
    { icon: Zap, text: 'Instant skill matching', color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-spin-slow"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-indigo-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-purple-400 rounded-full animate-ping animation-delay-1000"></div>
        <div className="absolute top-40 right-40 w-2 h-2 bg-pink-400 rounded-full animate-ping animation-delay-2000"></div>
      </div>

      <div className="relative max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Benefits */}
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
            Start Your
            <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              Learning Journey
            </span>
          </h1>

          <p className="text-xl text-indigo-200 max-w-lg">
            Join thousands of learners and mentors in the world's most intelligent peer learning platform.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                  <div className={`p-2 bg-${benefit.color}-500/20 rounded-lg`}>
                    <Icon className={`w-5 h-5 text-${benefit.color}-400`} />
                  </div>
                  <span className="text-sm text-indigo-100">{benefit.text}</span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-indigo-200 text-sm">Active Users</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-indigo-200 text-sm">Skills Shared</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-3xl font-bold text-white">4.8</div>
              <div className="text-indigo-200 text-sm">User Rating</div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse animation-delay-2000"></div>

          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20" data-testid="register-form-container">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-200 px-4 py-2 rounded-full mb-4 border border-indigo-400/30">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Join for Free</span>
                <Rocket className="w-4 h-4" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h2>
              <p className="text-indigo-200">
                Get started with your 7-day free trial
              </p>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        currentStep >= step.number
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {currentStep > step.number && (
                        <Check className="absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-green-900/30 rounded-full" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-xs ${currentStep >= step.number ? 'text-indigo-200' : 'text-gray-500'}`}>
                        Step {step.number}
                      </p>
                      <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className={`w-5 h-5 mx-2 ${
                        currentStep > step.number ? 'text-indigo-400' : 'text-gray-600'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-200 animate-slide-down" data-testid="register-success">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
                <div className="ml-auto w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 animate-shake" data-testid="register-error">
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

            <form className="space-y-6" onSubmit={handleSubmit} data-testid="register-form">
              {/* Step 1: Account Info */}
              <div className={`space-y-4 transition-all ${currentStep === 1 ? 'block' : 'hidden'}`}>
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2">
                    Email Address *
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

                <div className="group">
                  <label htmlFor="username" className="block text-sm font-medium text-indigo-200 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={handleChange}
                      data-testid="username-input"
                    />
                    {usernameAvailable !== null && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameAvailable ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {usernameAvailable === false && (
                    <p className="mt-1 text-xs text-red-400">Username is already taken</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="mt-1 text-xs text-green-400">Username is available</p>
                  )}
                </div>

                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={72} // Add maxlength attribute for browser validation
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Create a strong password (max 72 chars)"
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

                  {/* Password Strength and Length Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      {/* Length warning */}
                      {passwordByteLength > 72 && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-xs text-red-300">
                            Password exceeds 72 character limit. Current length: {passwordByteLength} bytes
                          </span>
                        </div>
                      )}
                      
                      {/* Strength meter */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                            style={{ width: `${passwordByteLength > 72 ? 100 : passwordStrength}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-indigo-300">{getPasswordStrengthText()}</span>
                      </div>
                      
                      {/* Character count */}
                      <div className="flex justify-between text-xs text-indigo-300 mb-2">
                        <span>Characters: {formData.password.length}</span>
                        <span>Bytes: {passwordByteLength}/72</span>
                      </div>
                      
                      {/* Requirements */}
                      <ul className="text-xs text-indigo-300 space-y-1">
                        <li className="flex items-center gap-1">
                          {formData.password.length >= 8 ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-500" />
                          )}
                          At least 8 characters
                        </li>
                        <li className="flex items-center gap-1">
                          {/[A-Z]/.test(formData.password) ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-500" />
                          )}
                          One uppercase letter
                        </li>
                        <li className="flex items-center gap-1">
                          {/[0-9]/.test(formData.password) ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-500" />
                          )}
                          One number
                        </li>
                        <li className="flex items-center gap-1">
                          {passwordByteLength <= 72 ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                          Maximum 72 bytes (current: {passwordByteLength})
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Personal Info */}
              <div className={`space-y-4 transition-all ${currentStep === 2 ? 'block' : 'hidden'}`}>
                <div className="group">
                  <label htmlFor="full_name" className="block text-sm font-medium text-indigo-200 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={handleChange}
                      data-testid="fullname-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="group">
                    <label htmlFor="location" className="block text-sm font-medium text-indigo-200 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        id="location"
                        name="location"
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="New York, USA"
                        value={formData.location}
                        onChange={handleChange}
                        data-testid="location-input"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label htmlFor="phone" className="block text-sm font-medium text-indigo-200 mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={handleChange}
                        data-testid="phone-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Complete */}
              <div className={`space-y-6 transition-all ${currentStep === 3 ? 'block' : 'hidden'}`}>
                <div className="text-center py-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Almost Done!</h3>
                  <p className="text-indigo-200 mb-6">
                    Please review your information and agree to our terms to complete registration.
                  </p>

                  {/* Info Summary */}
                  <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-indigo-200 mb-2">Email: {formData.email}</p>
                    <p className="text-sm text-indigo-200 mb-2">Username: {formData.username}</p>
                    <p className="text-sm text-indigo-200">Full Name: {formData.full_name || 'Not provided'}</p>
                    <p className="text-sm text-indigo-200 mt-2">
                      Password: {'•'.repeat(Math.min(formData.password.length, 10))} 
                      <span className="ml-2 text-xs text-indigo-300">
                        ({formData.password.length} chars, {passwordByteLength} bytes)
                      </span>
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-indigo-200 group-hover:text-indigo-100 transition-colors">
                    I agree to the{' '}
                    <a href="#" className="text-white underline decoration-indigo-400/50 hover:decoration-indigo-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-white underline decoration-indigo-400/50 hover:decoration-indigo-300">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 py-4 px-4 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 py-4 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !agreeTerms || passwordByteLength > 72}
                    className="flex-1 py-4 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                    data-testid="register-submit-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <Rocket className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Social Registration */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-indigo-200">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { provider: 'Google', icon: Mail, color: 'hover:bg-orange-500/20' },
                  { provider: 'GitHub', icon: Github, color: 'hover:bg-gray-500/20' },
                  { provider: 'Twitter', icon: Twitter, color: 'hover:bg-blue-500/20' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all"
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-indigo-200">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-white hover:text-indigo-200 transition-colors underline decoration-indigo-400/50 hover:decoration-indigo-300"
                    data-testid="login-link"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-indigo-300">
              <Shield className="w-4 h-4" />
              <span>Your data is encrypted and secure</span>
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

export default Register;