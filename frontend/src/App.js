import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  LogOut,
  Home,
  BarChart3,
  FileText
} from 'lucide-react';
import ImprovedAITaskCreator from './ImprovedAITaskCreator';
import NotesManager from './NotesManager';

// API Configuration - works in both development and production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class TaskAPI {
  static token = localStorage.getItem('token');

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      ...options
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  static async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials
    });
    this.token = response.token;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  static async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
    this.token = response.token;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  static async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  static async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: taskData
    });
  }

  static async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: taskData
    });
  }

  static async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  static async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  static logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// Calendar setup
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Auth Component
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await TaskAPI.login({ email: formData.email, password: formData.password });
      } else {
        await TaskAPI.register(formData);
      }
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Get demo token from backend
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        TaskAPI.token = data.token;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <CalendarIcon className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-600">Organize your life efficiently</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Try Demo Login (Test AI Features)
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats }) => {
  const statCards = [
    { title: 'Total Tasks', value: stats.totalTasks, icon: BarChart3, color: 'bg-blue-500' },
    { title: 'Completed', value: stats.completedTasks, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'In Progress', value: stats.inProgressTasks, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Due Today', value: stats.tasksDueToday, icon: AlertCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
          <span className="text-lg font-semibold text-gray-900">{stats.completionRate}%</span>
        </div>
      </div>
    </div>
  );
};

// Task Form Component
const TaskForm = ({ onSubmit, onCancel, initialTask = null }) => {
  const [task, setTask] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    category: 'general',
    status: 'pending',
    startDate: '',
    endDate: '',
    dueDate: '',
    isAllDay: false,
    reminderTime: '',
    ...initialTask
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task);
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={task.description}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={task.type}
                  onChange={(e) => setTask({ ...task, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="task">Task</option>
                  <option value="event">Event</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={task.priority}
                  onChange={(e) => setTask({ ...task, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={task.category}
                  onChange={(e) => setTask({ ...task, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => setTask({ ...task, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {task.type === 'event' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(task.startDate)}
                    onChange={(e) => setTask({ ...task, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(task.endDate)}
                    onChange={(e) => setTask({ ...task, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="datetime-local"
                value={formatDateForInput(task.dueDate)}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {task.type === 'reminder' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Time</label>
                <input
                  type="datetime-local"
                  value={formatDateForInput(task.reminderTime)}
                  onChange={(e) => setTask({ ...task, reminderTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {initialTask ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calendarView, setCalendarView] = useState('month');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadDashboardStats();
    }
  }, [isAuthenticated]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await TaskAPI.getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await TaskAPI.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await TaskAPI.createTask(taskData);
      setShowTaskForm(false);
      loadTasks();
      loadDashboardStats();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await TaskAPI.updateTask(editingTask._id, taskData);
      setEditingTask(null);
      setShowTaskForm(false);
      loadTasks();
      loadDashboardStats();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await TaskAPI.deleteTask(taskId);
        loadTasks();
        loadDashboardStats();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleLogout = () => {
    TaskAPI.logout();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setTasks([]);
    setDashboardStats({});
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // Convert tasks to calendar events
  const calendarEvents = tasks.map(task => {
    let start, end;
    
    if (task.type === 'event' && task.startDate) {
      start = new Date(task.startDate);
      end = task.endDate ? new Date(task.endDate) : new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    } else if (task.dueDate) {
      start = new Date(task.dueDate);
      end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    } else {
      start = new Date(task.createdAt);
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    return {
      id: task._id,
      title: task.title,
      start,
      end,
      resource: task,
      allDay: task.isAllDay || task.type === 'task'
    };
  });

  const eventStyleGetter = (event) => {
    const task = event.resource;
    let backgroundColor = '#3174ad';
    
    switch (task.priority) {
      case 'high':
        backgroundColor = '#ef4444';
        break;
      case 'medium':
        backgroundColor = '#f59e0b';
        break;
      case 'low':
        backgroundColor = '#10b981';
        break;
      default:
        backgroundColor = '#6b7280';
        break;
    }

    if (task.status === 'completed') {
      backgroundColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: task.status === 'completed' ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const TaskList = () => {
    const pendingTasks = tasks.filter(task => task.status !== 'completed');
    const completedTasks = tasks.filter(task => task.status === 'completed');

    const TaskItem = ({ task }) => {
      const priorityColors = {
        high: 'border-l-red-500',
        medium: 'border-l-yellow-500',
        low: 'border-l-green-500'
      };

      const statusColors = {
        pending: 'text-gray-600',
        'in-progress': 'text-blue-600',
        completed: 'text-green-600 line-through'
      };

      return (
        <div className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColors[task.priority]} p-4 mb-3`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className={`font-semibold ${statusColors[task.status]}`}>{task.title}</h4>
              {task.description && (
                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">{task.type}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{task.category}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{task.priority} priority</span>
                {task.dueDate && (
                  <span className="text-red-600">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditTask(task)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTask(task._id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <button
            onClick={() => setShowTaskForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks ({pendingTasks.length})</h3>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active tasks. Create one to get started!</p>
            ) : (
              pendingTasks.map(task => <TaskItem key={task._id} task={task} />)
            )}
          </div>

          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Tasks ({completedTasks.length})</h3>
              {completedTasks.map(task => <TaskItem key={task._id} task={task} />)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const CalendarView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
        <div className="flex items-center space-x-4">
          <select
            value={calendarView}
            onChange={(e) => setCalendarView(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
            <option value="agenda">Agenda</option>
          </select>
          <button
            onClick={() => setShowTaskForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={calendarView}
          onView={setCalendarView}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => handleEditTask(event.resource)}
          popup
          showMultiDayTimes
          step={60}
          showAllEvents
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">High Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Medium Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Low Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <AuthForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900">Task Manager</span>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'dashboard' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('tasks')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'tasks' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Tasks</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('ai-assistant')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'ai-assistant' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>AI Assistant</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'calendar' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>Calendar</span>
                </button>
                
                <button
                  onClick={() => setCurrentView('notes')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'notes' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Notes</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="text-sm">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && <Dashboard stats={dashboardStats} />}
            {currentView === 'tasks' && <TaskList />}
            {currentView === 'ai-assistant' && (
              <ImprovedAITaskCreator 
                onTaskCreate={handleCreateTask}
                tasks={tasks}
              />
            )}
            {currentView === 'calendar' && <CalendarView />}
            {currentView === 'notes' && <NotesManager token={localStorage.getItem('token')} />}
          </>
        )}
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          initialTask={editingTask}
        />
      )}
    </div>
  );
};

export default App;