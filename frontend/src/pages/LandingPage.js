import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  Users,
  Bot,
  Briefcase,
  BookOpen,
  Star,
  Shield,
  Zap,
  TrendingUp,
  Globe,
  Award,
  ChevronRight,
  Play,
  MessageSquare,
  Clock,
  CheckCircle,
  Heart,
  Rocket,
  Target,
  Brain,
  GraduationCap,
  Lightbulb,
  Compass,
  Code,
  Palette,
  Camera,
  Music
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Skill Exchange',
      description: 'Exchange knowledge with peers. Learn what you need, teach what you know.',
      color: 'from-cyan-400 to-blue-500',
      stats: '500+ Skills',
      delay: '0s'
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get personalized learning paths and skill recommendations from our AI.',
      color: 'from-purple-400 to-pink-500',
      stats: '24/7 Available',
      delay: '0.2s'
    },
    {
      icon: Briefcase,
      title: 'Task Marketplace',
      description: 'Earn by helping others with academic tasks or get help when you need it.',
      color: 'from-green-400 to-emerald-500',
      stats: '₹50K+ Earned',
      delay: '0.4s'
    },
    {
      icon: BookOpen,
      title: 'Live Sessions',
      description: 'Book one-on-one mentorship sessions with verified skill holders.',
      color: 'from-orange-400 to-red-500',
      stats: '1000+ Sessions',
      delay: '0.6s'
    },
  ];

  const stats = [
    { icon: Users, value: '10K+', label: 'Active Students', color: 'cyan' },
    { icon: Star, value: '4.8', label: 'Average Rating', color: 'yellow' },
    { icon: Globe, value: '50+', label: 'Countries', color: 'green' },
    { icon: Award, value: '1000+', label: 'Skills Mastered', color: 'purple' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CS Student',
      content: 'TalentConnect helped me master React in just 2 months. The AI recommendations were spot on!',
      rating: 5,
      skill: 'Web Development',
      avatar: 'SJ',
      delay: '0s'
    },
    {
      name: 'Michael Chen',
      role: 'Data Science Mentor',
      content: 'As a mentor, I love how easy it is to share knowledge and earn while helping others.',
      rating: 5,
      skill: 'Machine Learning',
      avatar: 'MC',
      delay: '0.2s'
    },
    {
      name: 'Priya Patel',
      role: 'Design Student',
      content: 'The UI/UX design sessions were incredible. Learned more here than in my entire degree!',
      rating: 5,
      skill: 'UI/UX Design',
      avatar: 'PP',
      delay: '0.4s'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden relative">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg2LDE4MiwyMTIsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Mouse Follower Glow */}
      <div
        className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      ></div>

      {/* Premium Dark Navbar */}
      <nav className="relative z-50 backdrop-blur-2xl bg-black/40 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br  from-teal-400 via-red-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-neon-cyan transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent tracking-tight">
                TalentConnect
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-cyan-400 font-bold transition-all hover:scale-110">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-purple-400 font-bold transition-all hover:scale-110">How it Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-pink-400 font-bold transition-all hover:scale-110">Testimonials</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-8 py-3 rounded-2xl font-black hover:shadow-neon-cyan transition-all duration-300 transform hover:scale-105"
                  data-testid="dashboard-link"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white font-bold transition-colors px-6 py-3 hover:bg-white/5 rounded-xl"
                    data-testid="login-link"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="group relative overflow-hidden bg-gradient-to-r from-teal-500 via-red-500 to-yellow-500 text-white px-8 py-3 rounded-2xl font-black hover:shadow-neon-cyan transition-all duration-300 transform hover:scale-105"
                    data-testid="register-link"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started
                      <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-32 px-4 overflow-hidden" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 glass-card-admin px-6 py-3 rounded-full mb-8 border border-cyan-500/30 shadow-neon-cyan animate-slide-up">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-sm font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI-POWERED LEARNING PLATFORM
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            {/* Main Heading with Gradient Animation */}
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-none animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <span className="block text-white mb-2">Learn Together</span>
              <span className="block bg-gradient-to-r from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent animate-gradient-x">
                Grow Together
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-2xl text-gray-400 font-semibold mb-12 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              Join the intelligent peer-to-peer learning platform where students{' '}
              <span className="text-cyan-400 font-black">exchange skills</span>,{' '}
              <span className="text-purple-400 font-black">collaborate</span>, and{' '}
              <span className="text-pink-400 font-black">unlock their potential</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/register"
                    className="group relative overflow-hidden bg-gradient-to-r from-teal-500 via-red-500 to-yellow-500 text-white px-12 py-6 rounded-2xl text-xl font-black hover:shadow-neon-cyan transition-all duration-300 transform hover:scale-110"
                    data-testid="hero-cta-button"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Start Learning Now
                      <Rocket className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>

                  <button className="group relative overflow-hidden glass-card-admin px-12 py-6 rounded-2xl text-xl font-black text-white border border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-neon-cyan transition-all duration-300 transform hover:scale-110">
                    <span className="relative z-10 flex items-center gap-3">
                      <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      Watch Demo
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.8s' }}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="group text-center">
                    <div className={`inline-flex p-4 rounded-2xl glass-card-admin border border-${stat.color}-500/30 mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-neon-${stat.color}`}>
                      <Icon className={`w-8 h-8 text-${stat.color}-400`} />
                    </div>
                    <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">{stat.value}</div>
                    <div className="text-gray-400 font-bold">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 glass-card-admin px-5 py-2 rounded-full mb-6 border border-purple-500/30">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-black text-purple-400">FEATURES</span>
            </div>
            <h2 className="text-6xl font-black text-white mb-6">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r  from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-gray-400 font-semibold max-w-3xl mx-auto">
              Powerful tools and AI-driven features designed to accelerate your learning journey
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden glass-card-admin rounded-3xl p-10 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-neon-cyan animate-slide-up"
                  style={{ animationDelay: feature.delay }}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-5 bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <span className="px-4 py-2 glass-card-admin rounded-full text-sm font-black text-cyan-400 border border-cyan-500/30">
                        {feature.stats}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-3xl font-black text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-lg font-semibold mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Learn More Link */}
                    <div className="flex items-center gap-2 text-cyan-400 font-black group-hover:gap-4 transition-all">
                      <span>Learn More</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 px-4 bg-gradient-to-b from-black via-gray-900/50 to-black">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 glass-card-admin px-5 py-2 rounded-full mb-6 border border-cyan-500/30">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-black text-cyan-400">HOW IT WORKS</span>
            </div>
            <h2 className="text-6xl font-black text-white mb-6">
              Get Started in{' '}
              <span className="bg-gradient-to-r  from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Create Profile', desc: 'Sign up and list your skills and learning goals', icon: Users, color: 'cyan' },
              { num: '02', title: 'Get Matched', desc: 'AI finds perfect learning partners for you', icon: Brain, color: 'purple' },
              { num: '03', title: 'Start Learning', desc: 'Join sessions and grow your skills', icon: Rocket, color: 'pink' },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="group relative glass-card-admin rounded-3xl p-10 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-neon-cyan text-center"
                >
                  {/* Step Number */}
                  <div className={`text-9xl font-black bg-gradient-to-r from-${step.color}-400 to-${step.color}-600 bg-clip-text text-transparent opacity-20 mb-4`}>
                    {step.num}
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className={`p-6 bg-gradient-to-br from-${step.color}-400 to-${step.color}-600 rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-3xl font-black text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 text-lg font-semibold">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 glass-card-admin px-5 py-2 rounded-full mb-6 border border-pink-500/30">
              <Heart className="w-5 h-5 text-pink-400" />
              <span className="text-sm font-black text-pink-400">TESTIMONIALS</span>
            </div>
            <h2 className="text-6xl font-black text-white mb-6">
              Loved by{' '}
              <span className="bg-gradient-to-r  from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                Students Worldwide
              </span>
            </h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative glass-card-admin rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-neon-cyan animate-slide-up"
                style={{ animationDelay: testimonial.delay }}
              >
                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-300 text-lg font-semibold mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-700">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-black">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm font-semibold">{testimonial.role}</div>
                  </div>
                </div>

                {/* Skill Badge */}
                <div className="absolute top-8 right-8 px-3 py-1 glass-card-admin rounded-full text-xs font-black text-purple-400 border border-purple-500/30">
                  {testimonial.skill}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden glass-card-admin rounded-3xl p-16 border-2 border-cyan-500/30 shadow-neon-cyan text-center">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>

            <div className="relative z-10">
              <h2 className="text-6xl font-black text-white mb-6">
                Ready to{' '}
                <span className="bg-gradient-to-r  from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                  Transform
                </span>
                {' '}Your Learning?
              </h2>
              <p className="text-2xl text-gray-400 font-semibold mb-10 max-w-2xl mx-auto">
                Join thousands of students already accelerating their skills with AI-powered learning
              </p>

              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="group inline-flex relative overflow-hidden bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-12 py-6 rounded-2xl text-xl font-black hover:shadow-neon-cyan transition-all duration-300 transform hover:scale-110"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Get Started Free
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br  from-teal-400 via-red-400 to-yellow-400 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r  from-teal-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
              TalentConnect
            </span>
          </div>
          <p className="text-gray-400 font-semibold">
            © 2026 TalentConnect. All rights reserved to Javeriya.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
