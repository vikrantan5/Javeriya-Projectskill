import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { roadmapService, skillService } from '../services/apiService';
import { Brain, Loader2, Map, CheckCircle2, Rocket, Target } from 'lucide-react';

const RoadmapPlanner = () => {
  const [careerGoal, setCareerGoal] = useState('');
  const [knownSkills, setKnownSkills] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [message, setMessage] = useState('');

  const steps = useMemo(
    () => selectedRoadmap?.roadmap_data?.steps || selectedRoadmap?.steps || [],
    [selectedRoadmap]
  );

  useEffect(() => {
    loadMySkills();
    loadMyRoadmaps();
  }, []);

  const loadMySkills = async () => {
    try {
      const result = await skillService.getMySkills();
      setKnownSkills((result || []).map((item) => item.skill_name).filter(Boolean));
    } catch (_e) {
      setKnownSkills([]);
    }
  };

  const loadMyRoadmaps = async () => {
    setLoadingRoadmaps(true);
    try {
      const result = await roadmapService.getMyRoadmaps(false);
      const allRoadmaps = result?.roadmaps || [];
      setRoadmaps(allRoadmaps);
      if (allRoadmaps.length > 0) {
        setSelectedRoadmap(allRoadmaps[0]);
      }
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Unable to load roadmaps');
    }
    setLoadingRoadmaps(false);
  };

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!careerGoal.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const response = await roadmapService.generate(careerGoal.trim(), knownSkills);
      const generated = response?.roadmap;
      if (generated?.roadmap_id) {
        await loadMyRoadmaps();
      } else {
        setSelectedRoadmap(generated);
      }
      setCareerGoal('');
      setMessage('Roadmap generated successfully.');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Failed to generate roadmap');
    }
    setLoading(false);
  };

  const updateProgress = async (currentStep, completionPercentage) => {
    if (!selectedRoadmap?.id) return;
    setUpdatingProgress(true);
    try {
      await roadmapService.updateProgress(selectedRoadmap.id, currentStep, completionPercentage);
      await loadMyRoadmaps();
      setMessage('Progress updated.');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Failed to update progress');
    }
    setUpdatingProgress(false);
  };

  const markCompleted = async () => {
    if (!selectedRoadmap?.id) return;
    setUpdatingProgress(true);
    try {
      await roadmapService.complete(selectedRoadmap.id);
      await loadMyRoadmaps();
      setMessage('Roadmap completed. Tokens awarded.');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Failed to complete roadmap');
    }
    setUpdatingProgress(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-cyan-950" data-testid="roadmap-page">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="roadmap-page-title">AI Study Roadmap Planner</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Generate personalized learning paths and track completion progress.</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" data-testid="known-skills-count">
            Skills detected: <strong>{knownSkills.length}</strong>
          </div>
        </div>

        {message && (
          <div className="px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700" data-testid="roadmap-status-message">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleGenerateRoadmap} className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl p-6 shadow-lg space-y-4" data-testid="roadmap-generate-form">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <Brain className="w-5 h-5 text-indigo-600" />
              Generate New Roadmap
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Career Goal</label>
              <input
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. Backend Developer"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                required
                data-testid="roadmap-career-goal-input"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="roadmap-known-skills-list">
              <p className="font-medium mb-1">Current Skills (auto-detected)</p>
              <p>{knownSkills.length ? knownSkills.join(', ') : 'No skills found yet in profile.'}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white disabled:opacity-50"
              data-testid="roadmap-generate-button"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              Generate Roadmap
            </button>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500" data-testid="roadmap-token-note">Complete a roadmap to earn SkillTokens.</p>
            </div>
          </form>

          <div className="lg:col-span-2 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl p-6 shadow-lg" data-testid="roadmap-results-panel">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Map className="w-5 h-5 text-indigo-600" />
                My Roadmaps
              </h2>
              {loadingRoadmaps && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" data-testid="roadmap-list-loading" />}
            </div>

            {roadmaps.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" data-testid="roadmap-selector-list">
                {roadmaps.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRoadmap(item)}
                    className={`px-3 py-2 rounded-lg text-sm border ${selectedRoadmap?.id === item.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}
                    data-testid="roadmap-selector-button"
                  >
                    {item.career_goal}
                  </button>
                ))}
              </div>
            )}

            {!selectedRoadmap ? (
              <div className="p-10 text-center text-gray-500" data-testid="roadmap-empty-state">
                Generate your first roadmap to see structured step-by-step guidance.
              </div>
            ) : (
              <div className="space-y-4" data-testid="roadmap-details">
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white" data-testid="roadmap-selected-goal">{selectedRoadmap.career_goal || selectedRoadmap?.roadmap_data?.career_goal}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1" data-testid="roadmap-estimated-time">
                    Estimated Time: {selectedRoadmap?.roadmap_data?.estimated_total_time || selectedRoadmap?.estimated_total_time || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300" data-testid="roadmap-completion-percentage">
                    Completion: {Math.round(Number(selectedRoadmap.completion_percentage || 0))}%
                  </p>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto" data-testid="roadmap-steps-list">
                  {steps.map((step, index) => (
                    <div key={`${step.step_number}-${index}`} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-indigo-600 font-semibold" data-testid="roadmap-step-number">Step {step.step_number || index + 1}</p>
                      <h4 className="font-semibold text-gray-900 dark:text-white" data-testid="roadmap-step-title">{step.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1" data-testid="roadmap-step-description">{step.description}</p>
                      <p className="text-xs text-gray-500 mt-2" data-testid="roadmap-step-time">Estimated: {step.estimated_time || 'N/A'}</p>
                    </div>
                  ))}
                </div>

                {selectedRoadmap?.id && (
                  <div className="flex flex-wrap gap-3 pt-2" data-testid="roadmap-actions-row">
                    <button
                      onClick={() => updateProgress((selectedRoadmap.current_step || 1) + 1, Math.min(100, Number(selectedRoadmap.completion_percentage || 0) + 10))}
                      disabled={updatingProgress}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
                      data-testid="roadmap-update-progress-button"
                    >
                      <Target className="w-4 h-4" />
                      Mark Next Step
                    </button>

                    <button
                      onClick={markCompleted}
                      disabled={updatingProgress}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
                      data-testid="roadmap-complete-button"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Roadmap
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPlanner;