import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { sessionService } from '../services/apiService';

const SessionBooking = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
     const data = await sessionService.getMySessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="session-booking-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Sessions</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" data-testid="no-sessions">
            <p className="text-gray-500 mb-4">You don't have any sessions yet.</p>
            <p className="text-sm text-gray-400">
              Go to Skills marketplace to find mentors and request sessions!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl p-6 shadow-sm" data-testid="session-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{session.skill_name}</h3>
                    <p className="text-gray-600 mb-4">
                      Duration: {session.duration_minutes} minutes
                    </p>
                    {session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Join Meeting →
                      </a>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.status === 'completed' ? 'bg-green-100 text-green-600' :
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                    session.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionBooking;
