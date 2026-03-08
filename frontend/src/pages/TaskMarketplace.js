import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { taskService } from '../services/apiService';

const TaskMarketplace = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'medium',
    price: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'all') {
        data = await taskService.getAllTasks('open');
      } else if (activeTab === 'my-tasks') {
        data = await taskService.getMyTasks();
      } else if (activeTab === 'accepted') {
        data = await taskService.getAcceptedTasks();
      } else {
        data = await taskService.getAllTasks(activeTab);
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
    setLoading(false);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.createTask(newTask);
      alert('Task created successfully!');
      setShowCreateTask(false);
      setNewTask({
        title: '',
        description: '',
        subject: '',
        difficulty_level: 'medium',
        price: '',
        deadline: '',
      });
      loadTasks();
    } catch (error) {
      alert('Failed to create task: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await taskService.acceptTask(taskId);
      alert('Task accepted! You can now work on it.');
      loadTasks();
    } catch (error) {
      alert('Failed to accept task: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="task-marketplace-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Marketplace</h1>
          <button
            onClick={() => setShowCreateTask(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            data-testid="create-task-button"
          >
            + Create Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b" data-testid="task-tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'all'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="all-tasks-tab"
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'open'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="open-tasks-tab"
          >
            Open
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'my-tasks'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="my-tasks-tab"
          >
            My Tasks
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" data-testid="no-tasks">
            <p className="text-gray-500">No tasks available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm" data-testid="task-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center text-gray-600">
                        <span className="font-medium mr-1">Subject:</span> {task.subject || 'General'}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <span className="font-medium mr-1">Difficulty:</span> {task.difficulty_level}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <span className="font-medium mr-1">Deadline:</span> 
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ₹{task.price}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      task.status === 'open' ? 'bg-green-100 text-green-600' :
                      task.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                      task.status === 'submitted' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {task.status === 'open' && (
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                    data-testid="accept-task-button"
                  >
                    Accept Task
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-task-modal">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Help with Python Assignment"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    data-testid="task-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe the task in detail..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    data-testid="task-description-input"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Computer Science"
                      value={newTask.subject}
                      onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                      data-testid="task-subject-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      value={newTask.difficulty_level}
                      onChange={(e) => setNewTask({ ...newTask, difficulty_level: e.target.value })}
                      data-testid="task-difficulty-select"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="500"
                      value={newTask.price}
                      onChange={(e) => setNewTask({ ...newTask, price: e.target.value })}
                      data-testid="task-price-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      data-testid="task-deadline-input"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateTask(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    data-testid="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    data-testid="submit-task-button"
                  >
                    {loading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskMarketplace;
