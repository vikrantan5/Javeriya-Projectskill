import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { skillService } from '../services/apiService';

const SkillMarketplace = () => {
  const [activeTab, setActiveTab] = useState('my-skills');
  const [mySkills, setMySkills] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [searchSkill, setSearchSkill] = useState('');
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_type: 'offered',
    skill_level: 'intermediate',
  });
  const [loading, setLoading] = useState(false);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await skillService.addSkill(newSkill);
      alert('Skill added successfully!');
      setShowAddSkill(false);
      setNewSkill({ skill_name: '', skill_type: 'offered', skill_level: 'intermediate' });
      loadMySkills();
    } catch (error) {
      alert('Failed to add skill: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const loadMySkills = async () => {
    try {
      const data = await skillService.getSkills();
      setMySkills(data);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const searchMentors = async () => {
    if (!searchSkill.trim()) return;
    setLoading(true);
    try {
      const data = await skillService.findMentors(searchSkill);
      setMentors(data);
    } catch (error) {
      console.error('Error finding mentors:', error);
      alert('Failed to find mentors');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'my-skills') {
      loadMySkills();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="skill-marketplace-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Skill Marketplace</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b" data-testid="skill-tabs">
          <button
            onClick={() => setActiveTab('my-skills')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'my-skills'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="my-skills-tab"
          >
            My Skills
          </button>
          <button
            onClick={() => setActiveTab('find-mentors')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'find-mentors'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="find-mentors-tab"
          >
            Find Mentors
          </button>
        </div>

        {/* My Skills Tab */}
        {activeTab === 'my-skills' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Skills</h2>
              <button
                onClick={() => setShowAddSkill(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                data-testid="add-skill-button"
              >
                + Add Skill
              </button>
            </div>

            {mySkills.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center" data-testid="no-skills">
                <p className="text-gray-500 mb-4">You haven't added any skills yet.</p>
                <button
                  onClick={() => setShowAddSkill(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Add your first skill →
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySkills.map((skill) => (
                  <div key={skill.id} className="bg-white rounded-xl p-6 shadow-sm" data-testid="skill-card">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{skill.skill_name}</h3>
                      {skill.is_verified && (
                        <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {skill.skill_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Level:</span> {skill.skill_level || 'Not specified'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Skill Modal */}
            {showAddSkill && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="add-skill-modal">
                <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                  <h2 className="text-2xl font-bold mb-6">Add New Skill</h2>
                  <form onSubmit={handleAddSkill} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skill Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., JavaScript, Photography"
                        value={newSkill.skill_name}
                        onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                        data-testid="skill-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={newSkill.skill_type}
                        onChange={(e) => setNewSkill({ ...newSkill, skill_type: e.target.value })}
                        data-testid="skill-type-select"
                      >
                        <option value="offered">I can teach this</option>
                        <option value="wanted">I want to learn this</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skill Level
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={newSkill.skill_level}
                        onChange={(e) => setNewSkill({ ...newSkill, skill_level: e.target.value })}
                        data-testid="skill-level-select"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddSkill(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        data-testid="cancel-button"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        data-testid="submit-skill-button"
                      >
                        {loading ? 'Adding...' : 'Add Skill'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Find Mentors Tab */}
        {activeTab === 'find-mentors' && (
          <div>
            <div className="mb-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search for a skill..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={searchSkill}
                  onChange={(e) => setSearchSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchMentors()}
                  data-testid="search-skill-input"
                />
                <button
                  onClick={searchMentors}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  data-testid="search-mentors-button"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {mentors.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center" data-testid="no-mentors">
                <p className="text-gray-500">Enter a skill to find mentors</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                  <div key={mentor.user_id} className="bg-white rounded-xl p-6 shadow-sm" data-testid="mentor-card">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                        {mentor.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{mentor.full_name || mentor.username}</h3>
                        <p className="text-sm text-gray-500">{mentor.location || 'Location not set'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="font-medium">{mentor.average_rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          ({mentor.total_sessions || 0} sessions)
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Level: <span className="font-medium text-indigo-600">{mentor.skill_level}</span>
                      </div>
                      {mentor.is_verified && (
                        <div className="mt-2 inline-block bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">
                          ✓ Verified
                        </div>
                      )}
                    </div>

                    <button
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                      data-testid="request-session-button"
                    >
                      Request Session
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillMarketplace;
