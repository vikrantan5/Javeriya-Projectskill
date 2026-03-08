import React, { useEffect, useRef } from 'react';
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
  Compass
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrolled = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Skill Exchange',
      description: 'Exchange knowledge with peers. Learn what you need, teach what you know.',
      color: 'from-blue-500 to-cyan-400',
      stats: '500+ Skills',
      gradient: 'from-blue-600 to-cyan-500'
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get personalized learning paths and skill recommendations from our AI.',
      color: 'from-purple-500 to-pink-400',
      stats: '24/7 Available',
      gradient: 'from-purple-600 to-pink-500'
    },
    {
      icon: Briefcase,
      title: 'Task Marketplace',
      description: 'Earn by helping others with academic tasks or get help when you need it.',
      color: 'from-green-500 to-emerald-400',
      stats: '₹50K+ Earned',
      gradient: 'from-green-600 to-emerald-500'
    },
    {
      icon: BookOpen,
      title: 'Live Sessions',
      description: 'Book one-on-one mentorship sessions with verified skill holders.',
      color: 'from-orange-500 to-red-400',
      stats: '1000+ Sessions',
      gradient: 'from-orange-600 to-red-500'
    },
  ];

  const stats = [
    { icon: Users, value: '10K+', label: 'Active Students', color: 'blue' },
    { icon: Star, value: '4.8', label: 'Average Rating', color: 'yellow' },
    { icon: Globe, value: '50+', label: 'Countries', color: 'green' },
    { icon: Award, value: '1000+', label: 'Skills Mastered', color: 'purple' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CS Student',
      image: 'https://images.unsplash.com/photo-1494790108777-286b5e8b5e3a?w=150',
      content: 'TalentConnect helped me master React in just 2 months. The AI recommendations were spot on!',
      rating: 5,
      skill: 'Web Development'
    },
    {
      name: 'Michael Chen',
      role: 'Data Science Mentor',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      content: 'As a mentor, I love how easy it is to share knowledge and earn while helping others.',
      rating: 5,
      skill: 'Machine Learning'
    },
    {
      name: 'Priya Patel',
      role: 'Design Student',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      content: 'The UI/UX design sessions were incredible. Learned more here than in my entire degree!',
      rating: 5,
      skill: 'UI/UX Design'
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Profile',
      description: 'Sign up and list your skills and learning goals',
      icon: Users,
      color: 'blue'
    },
    {
      number: '02',
      title: 'Get Matched',
      description: 'AI finds perfect learning partners for you',
      icon: Brain,
      color: 'purple'
    },
    {
      number: '03',
      title: 'Start Learning',
      description: 'Join sessions and grow your skills',
      icon: GraduationCap,
      color: 'green'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-indigo-50/30 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div ref={parallaxRef} className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-indigo-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-purple-400 rounded-full animate-ping animation-delay-1000"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TalentConnect
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Success Stories</a>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                  data-testid="dashboard-link"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-indigo-600 font-medium transition-colors px-4 py-2"
                    data-testid="login-link"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                    data-testid="register-link"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started
                      <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Learning Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Learn Together,
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Grow Together
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Join the intelligent peer-to-peer learning platform where students exchange skills,
                collaborate on tasks, and unlock their potential with AI-powered recommendations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                {!isAuthenticated && (
                  <>
                    <Link
                      to="/register"
                      className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300"
                      data-testid="hero-cta-button"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Start Learning Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </Link>
                    
                    <button className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 rounded-xl text-lg font-semibold text-gray-700 hover:border-indigo-600 hover:text-indigo-600 transition-all group">
                      <Play className="w-5 h-5" />
                      Watch Demo
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center lg:text-left">
                      <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 justify-center lg:justify-start">
                        <Icon className={`w-4 h-4 text-${stat.color}-400`} />
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full h-[600px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800" 
                  alt="Students collaborating"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent"></div>
                
                {/* Floating Cards */}
                <div className="absolute top-8 left-8 bg-white/90 backdrop-blur rounded-xl p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Skill Verified</p>
                      <p className="text-xs text-gray-600">React Development</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur rounded-xl p-4 shadow-xl animate-float animation-delay-2000">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-purple-600 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">4.8 Rating</p>
                      <p className="text-xs text-gray-600">from 500+ sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to accelerate your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                  data-testid={`feature-${feature.title.toLowerCase().replace(' ', '-')}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  
                  <div className={`inline-flex p-3 bg-gradient-to-r ${feature.color} rounded-xl text-white shadow-lg mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                      {feature.stats}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 bg-gradient-to-b from-white to-indigo-50/30" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Journey to Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to transform your learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative text-center group">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                  
                  <div className="relative inline-block mb-6">
                    <div className={`w-24 h-24 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 rounded-2xl rotate-45 transform group-hover:rotate-90 transition-all duration-500 shadow-xl`}>
                      <div className="absolute inset-0 flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-all duration-500">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className={`text-sm font-bold text-${step.color}-600`}>{step.number}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-24 bg-white" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied learners who transformed their careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-bl-full opacity-10"></div>
                
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-50"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                    {testimonial.skill}
                  </span>
                  <Heart className="w-4 h-4 text-red-400 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of students already learning and earning on TalentConnect.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group relative overflow-hidden bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300"
                data-testid="cta-button"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Join Now - It's Free!
                  <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              </Link>
              
              <button className="flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white rounded-xl text-lg font-semibold text-white hover:bg-white/10 transition-all group">
                <MessageSquare className="w-5 h-5" />
                Talk to Us
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">TalentConnect</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering students through peer-to-peer learning and skill exchange.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 TalentConnect. All rights reserved. Made with <Heart className="w-4 h-4 text-red-500 inline" /> for learners worldwide.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;