import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { taskService } from '../services/apiService';
import { ArrowLeftRight, Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const initialForm = {
  skill_offered: '',
  skill_requested: '',
  description: '',
};

const SkillExchangeMarketplace = () => {
    const getErrorMessage = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      const joined = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.msg) return item.msg;
          return null;
        })
        .filter(Boolean)
        .join(' | ');

      return joined || fallbackMessage;
    }

    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      return detail.msg || fallbackMessage;
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  };
  const [marketplaceTasks, setMarketplaceTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    const safeMessage = typeof message === 'string' ? message : String(message ?? 'Unexpected error');
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [marketData, mineData] = await Promise.all([
        taskService.getSkillExchangeTasks('open'),
        taskService.getMySkillExchangeTasks(),
      ]);
      setMarketplaceTasks(Array.isArray(marketData) ? marketData : []);
      setMyTasks(Array.isArray(mineData) ? mineData : []);
    } catch (error) {
     showToast(getErrorMessage(error, 'Failed to load exchange tasks'), 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.createSkillExchangeTask(form);
      setForm(initialForm);
      showToast('Skill exchange task created successfully');
      await loadData();
      setActiveTab('my');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to create exchange task'), 'error');
    }
    setLoading(false);
  };

  const handleAccept = async (taskId) => {
    setLoading(true);
    try {
      await taskService.acceptSkillExchangeTask(taskId);
      showToast('Exchange matched successfully');
      await loadData();
    } catch (error) {
     showToast(getErrorMessage(error, 'Unable to accept exchange task'), 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-sky-50/40 to-emerald-50/30 dark:from-gray-900 dark:via-sky-950 dark:to-emerald-950" data-testid="skill-exchange-page">
      <Navbar />

      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} data-testid="skill-exchange-toast">
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" data-testid="exchange-page-title">Skill Exchange Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create exact swap listings: I teach X, I want Y.</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            data-testid="exchange-refresh-button"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreate} className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg space-y-4" data-testid="exchange-create-form">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Exchange Task
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skill You Offer</label>
              <input
                value={form.skill_offered}
                onChange={(e) => setForm({ ...form, skill_offered: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="Python"
                required
                data-testid="exchange-offered-skill-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skill You Want</label>
              <input
                value={form.skill_requested}
                onChange={(e) => setForm({ ...form, skill_requested: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="Flutter"
                required
                data-testid="exchange-requested-skill-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="I can teach loops, APIs, and projects. Need Flutter basics in return."
                data-testid="exchange-description-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-medium disabled:opacity-50"
              data-testid="exchange-create-submit-button"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Publish Exchange
            </button>
          </form>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'marketplace' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                data-testid="exchange-marketplace-tab"
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'my' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                data-testid="exchange-my-tab"
              >
                My Listings
              </button>
            </div>

            {loading ? (
              <div className="text-gray-500" data-testid="exchange-loading-state">Loading...</div>
            ) : (
              <div className="space-y-4" data-testid="exchange-task-list">
                {(activeTab === 'marketplace' ? marketplaceTasks : myTasks).length === 0 ? (
                  <div className="p-8 text-center text-gray-500" data-testid="exchange-empty-state">
                    No exchange tasks found.
                  </div>
                ) : (
                  (activeTab === 'marketplace' ? marketplaceTasks : myTasks).map((item) => {
                    const exchangeTask = item.task || item;
                    const creator = item.creator;
                    return (
                      <div key={exchangeTask.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4" data-testid="exchange-task-card">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase text-gray-500 mb-2" data-testid="exchange-task-status">{exchangeTask.status}</p>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="exchange-skill-pair">
                              {exchangeTask.skill_offered} ↔ {exchangeTask.skill_requested}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1" data-testid="exchange-description-text">{exchangeTask.description || 'No description provided.'}</p>
                            {creator && (
                              <p className="text-xs text-gray-500 mt-2" data-testid="exchange-creator-text">
                                by {creator.full_name || creator.username}
                              </p>
                            )}
                          </div>

                          {activeTab === 'marketplace' && exchangeTask.status === 'open' && (
                            <button
                              onClick={() => handleAccept(exchangeTask.id)}
                              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              data-testid="exchange-accept-button"
                            >
                              Accept Match
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillExchangeMarketplace;