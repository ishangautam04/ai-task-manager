// server.js
require('dotenv').config(); // Load environment variables FIRST

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const ImprovedAIService = require('./improved-ai-services');

const app = express();
const aiService = ImprovedAIService;

// Middleware
app.use(cors());
app.use(express.json());

// Root route for testing
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Task Manager Backend API is running!',
    version: '2.0.0',
    features: ['Gemini AI Integration', 'Hugging Face ML', 'Smart Task Processing'],
    endpoints: {
      auth: '/api/auth/*',
      tasks: '/api/tasks',
      ai: '/api/ai/*',
      dashboard: '/api/dashboard/*'
    },
    status: 'operational'
  });
});

// Test endpoint to get a demo token (for testing purposes)
app.post('/api/auth/demo', async (req, res) => {
  try {
    // Create a demo token for testing
    const demoToken = jwt.sign(
      { userId: 'demo-user', email: 'demo@test.com' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Demo token created',
      token: demoToken,
      user: { id: 'demo-user', name: 'Demo User', email: 'demo@test.com' }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating demo token', error: error.message });
  }
});

// MongoDB Connection - MUST be set in .env file
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not defined in .env file!');
  console.error('Please create a .env file based on .env.example and add your MongoDB connection string.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Made optional for demo
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['task', 'event', 'reminder'], default: 'task' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'general' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  startDate: { type: Date },
  endDate: { type: Date },
  dueDate: { type: Date },
  isAllDay: { type: Boolean, default: false },
  reminderTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Optional for demo
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'general' },
  tags: [{ type: String }],
  
  // AI Analysis Results
  aiAnalysis: {
    summary: { type: String },
    sentiment: { type: String },
    mood: { type: String },
    suggestedTags: [{ type: String }],
    suggestedCategory: { type: String },
    keyPoints: [{ type: String }],
    readingTime: { type: Number }, // minutes
    complexity: { type: String }, // simple, medium, complex
    lastAnalyzed: { type: Date }
  },
  
  // Metadata
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// AI-powered endpoints using Hugging Face & Gemini
app.post('/api/ai/parse-task', async (req, res) => {
  console.log('🤖 AI TASK PARSING REQUEST RECEIVED');
  console.log('📝 Input text:', req.body.text);
  
  try {
    const { text } = req.body;
    
    if (!text) {
      console.log('❌ No text provided');
      return res.status(400).json({ message: 'Text is required' });
    }

    console.log('🧠 Starting Gemini AI parsing...');
    const parsedTask = await aiService.parseNaturalLanguageTask(text);
    
    if (!parsedTask || !parsedTask.aiProcessed) {
      console.log('⚠️ Gemini parsing failed, using fallback');
      // Fallback parsing if AI fails
      const fallbackTask = aiService.createFallbackTask(text);
      return res.json({
        ...fallbackTask,
        aiProcessed: false,
        source: 'fallback'
      });
    }

    console.log('✅ GEMINI AI PARSING SUCCESSFUL!');
    console.log('📊 Parsed result:', {
      title: parsedTask.title,
      category: parsedTask.category,
      urgency: parsedTask.urgency,
      dueDate: parsedTask.dueDate
    });

    res.json({
      ...parsedTask,
      aiProcessed: true,
      source: 'gemini_hf'
    });
  } catch (error) {
    console.error('❌ AI parsing error:', error);
    res.status(500).json({ message: 'Error parsing task', error: error.message });
  }
});

app.post('/api/ai/enhance-task', async (req, res) => {
  console.log('🔧 AI TASK ENHANCEMENT REQUEST RECEIVED');
  console.log('📝 Input:', req.body);
  
  try {
    const { title, description, dueDate } = req.body;
    
    console.log('🧠 Starting AI enhancement...');
    // Get AI suggestions using enhanced AI service
    const enhancements = await aiService.enhanceTask(title, description, dueDate);
    
    console.log('✅ AI ENHANCEMENT COMPLETE!');
    console.log('📊 Enhancement result:', enhancements);

    res.json({
      ...enhancements,
      aiProcessed: true,
      source: 'improved-ai-service'
    });
  } catch (error) {
    console.error('AI Enhancement error:', error);
    
    // Fallback enhancement
    const fallbackCategory = aiService.simpleCategorize(title, description || '');
    const fallbackPriority = aiService.simplePriorityDetection(title, description || '');
    
    res.json({
      suggestedCategory: fallbackCategory.category,
      categoryConfidence: fallbackCategory.confidence,
      suggestedPriority: fallbackPriority.priority,
      priorityConfidence: fallbackPriority.confidence,
      estimatedCompletionTime: 30,
      aiProcessed: false,
      source: 'fallback'
    });
  }
});

app.get('/api/ai/suggestions', async (req, res) => {
  console.log('📥 GET /api/ai/suggestions - Request received');
  try {
    const userTasks = await Task.find({});
    
    // Simple fallback suggestions since the new service doesn't have generateSmartSuggestions
    const suggestions = [
      "Break down large tasks into smaller, manageable steps",
      "Consider setting deadlines for tasks without due dates", 
      "Review and prioritize your high-priority tasks",
      "Group similar tasks together for efficiency"
    ];
    
    console.log('✅ AI suggestions generated');
    res.json({
      suggestions,
      analysisDate: new Date().toISOString(),
      taskCount: userTasks.length,
      source: 'simple_suggestions'
    });
  } catch (error) {
    console.error('❌ Error getting suggestions:', error);
    res.status(500).json({ message: 'Error getting suggestions', error: error.message });
  }
});

app.get('/api/ai/patterns', async (req, res) => {
  console.log('📥 GET /api/ai/patterns - Request received');
  try {
    const userTasks = await Task.find({ userId: req.user.userId });
    
    // Simple pattern analysis
    const patterns = {
      mostCommonCategory: 'general',
      averageCompletionTime: '1 day',
      peakProductivityHour: '10 AM',
      taskCompletionRate: '75%'
    };
    
    res.json({
      patterns,
      insights: {
        totalTasks: userTasks.length,
        completedTasks: userTasks.filter(t => t.status === 'completed').length,
        analysisDate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error analyzing patterns', error: error.message });
  }
});

// Batch AI Analysis endpoint
app.post('/api/ai/analyze-batch', async (req, res) => {
  console.log('📥 POST /api/ai/analyze-batch - Request received');
  try {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks array is required' });
    }

    const analysis = [];
    
    for (const task of tasks.slice(0, 10)) { // Limit to 10 tasks to avoid API limits
      try {
        // Use the new enhanced categorization and priority detection
        const [categoryResult, priorityResult] = await Promise.all([
          aiService.categorizeTaskWithHF(task.title, task.description || ''),
          aiService.detectPriorityWithSentiment(task.title, task.description || '')
        ]);
        
        analysis.push({
          taskId: task._id || task.id,
          title: task.title,
          currentCategory: task.category,
          currentPriority: task.priority,
          suggestedCategory: categoryResult.suggestedCategory,
          categoryConfidence: categoryResult.categoryConfidence,
          suggestedPriority: priorityResult.suggestedPriority,
          priorityConfidence: priorityResult.priorityConfidence,
          recommendations: {
            shouldUpdateCategory: categoryResult.categoryConfidence > 0.7 && categoryResult.suggestedCategory !== task.category,
            shouldUpdatePriority: priorityResult.priorityConfidence > 0.7 && priorityResult.suggestedPriority !== task.priority
          }
        });
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (taskError) {
        console.error(`Error analyzing task ${task.title}:`, taskError.message);
        analysis.push({
          taskId: task._id || task.id,
          title: task.title,
          error: 'Analysis failed',
          suggestedCategory: task.category,
          suggestedPriority: task.priority
        });
      }
    }
    
    res.json({
      analysis,
      processedCount: analysis.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error in batch analysis', error: error.message });
  }
});

// Task Routes
app.get('/api/tasks', async (req, res) => {
  console.log('📥 GET /api/tasks - Request received');
  console.log('🔐 Authorization header:', req.headers.authorization);
  
  try {
    const { startDate, endDate, type, status } = req.query;

    // Try to get user from token if provided
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        console.log('✅ Filtering tasks for authenticated user:', userId);
      } catch (error) {
        console.log('⚠️ Invalid token, showing all tasks (demo mode)');
      }
    } else {
      console.log('⚠️ No token provided, showing all tasks (demo mode)');
    }

    let filter = {};
    
    // Only filter by userId if we have an authenticated user
    if (userId) {
      filter.userId = userId;
    }

    // Add date filtering for calendar view
    if (startDate && endDate) {
      filter.$or = [
        {
          startDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          dueDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ];
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    console.log('🔍 Finding tasks with filter:', filter);
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    console.log(`✅ Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  console.log('📥 POST /api/tasks - Request received:', req.body);
  console.log('🔐 Authorization header:', req.headers.authorization);
  
  try {
    // Try to get user from token if provided
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        console.log('✅ Authenticated user ID:', userId);
      } catch (error) {
        console.log('⚠️ Invalid token, using demo mode');
      }
    } else {
      console.log('⚠️ No token provided, using demo mode');
    }

    const taskData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Only add userId if we have one (for authenticated users)
    if (userId) {
      taskData.userId = userId;
    }

    console.log('💾 Creating task with data:', taskData);
    const task = new Task(taskData);
    await task.save();
    console.log('✅ Task created successfully:', task._id);
    res.status(201).json(task);
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  console.log(`📥 PUT /api/tasks/${req.params.id} - Request received`);
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('✅ Task updated successfully');
    res.json(task);
  } catch (error) {
    console.error('❌ Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  console.log(`📥 DELETE /api/tasks/${req.params.id} - Request received`);
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('✅ Task deleted successfully');
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// Dashboard Stats Route
app.get('/api/dashboard/stats', async (req, res) => {
  console.log('📥 GET /api/dashboard/stats - Request received');
  console.log('🔐 Authorization header:', req.headers.authorization);
  
  try {
    // Try to get user from token if provided
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        console.log('✅ Getting stats for authenticated user:', userId);
      } catch (error) {
        console.log('⚠️ Invalid token, getting global stats (demo mode)');
      }
    } else {
      console.log('⚠️ No token provided, getting global stats (demo mode)');
    }

    // Filter by user if authenticated, otherwise show all tasks
    const filter = userId ? { userId } : {};

    const totalTasks = await Task.countDocuments(filter);
    const completedTasks = await Task.countDocuments({ ...filter, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ ...filter, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' });

    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.countDocuments({
      ...filter,
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'completed' }
    });

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      tasksDueToday
    };

    console.log('✅ Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  console.log('📥 GET /api/categories - Request received');
  try {
    const categories = await Task.distinct('category');
    console.log('✅ Categories found:', categories);
    res.json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// ============================================
// NOTES ENDPOINTS
// ============================================

// Get all notes
app.get('/api/notes', async (req, res) => {
  console.log('📥 GET /api/notes - Request received');
  console.log('🔐 Authorization header:', req.headers.authorization);
  
  try {
    const { category, tag, archived, search } = req.query;

    // Try to get user from token if provided
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        console.log('✅ Filtering notes for authenticated user:', userId);
      } catch (error) {
        console.log('⚠️ Invalid token, showing all notes (demo mode)');
      }
    } else {
      console.log('⚠️ No token provided, showing all notes (demo mode)');
    }

    let filter = {};
    
    // Only filter by userId if we have an authenticated user
    if (userId) {
      filter.userId = userId;
    }

    // Add filters
    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };
    if (archived) filter.isArchived = archived === 'true';
    
    // Text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    console.log('🔍 Finding notes with filter:', filter);
    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    console.log(`✅ Found ${notes.length} notes`);
    res.json(notes);
  } catch (error) {
    console.error('❌ Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
});

// Create a new note
app.post('/api/notes', async (req, res) => {
  console.log('📥 POST /api/notes - Request received:', req.body);
  console.log('🔐 Authorization header:', req.headers.authorization);
  
  try {
    // Try to get user from token if provided
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        console.log('✅ Authenticated user ID:', userId);
      } catch (error) {
        console.log('⚠️ Invalid token, using demo mode');
      }
    } else {
      console.log('⚠️ No token provided, using demo mode');
    }

    const noteData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Only add userId if we have one (for authenticated users)
    if (userId) {
      noteData.userId = userId;
    }

    console.log('💾 Creating note with data:', noteData);
    const note = new Note(noteData);
    await note.save();
    console.log('✅ Note created successfully:', note._id);
    res.status(201).json(note);
  } catch (error) {
    console.error('❌ Error creating note:', error);
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
});

// Get a specific note
app.get('/api/notes/:id', async (req, res) => {
  console.log(`📥 GET /api/notes/${req.params.id} - Request received`);
  
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    console.log('✅ Note found');
    res.json(note);
  } catch (error) {
    console.error('❌ Error fetching note:', error);
    res.status(500).json({ message: 'Error fetching note', error: error.message });
  }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
  console.log(`📥 PUT /api/notes/${req.params.id} - Request received`);
  
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log('✅ Note updated successfully');
    res.json(note);
  } catch (error) {
    console.error('❌ Error updating note:', error);
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  console.log(`📥 DELETE /api/notes/${req.params.id} - Request received`);
  
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log('✅ Note deleted successfully');
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

// ============================================
// AI ENDPOINTS FOR NOTES
// ============================================

// AI Note Analysis
app.post('/api/ai/analyze-note', async (req, res) => {
  console.log('🤖 AI NOTE ANALYSIS REQUEST RECEIVED');
  console.log('📝 Input:', req.body);
  
  try {
    const { title, content, analysisType = ['categorize', 'summarize', 'extract_tasks', 'sentiment'] } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    console.log('🧠 Starting Gemini AI note analysis...');
    const analysis = await aiService.analyzeNote(title, content, analysisType);
    
    console.log('✅ AI NOTE ANALYSIS COMPLETE!');
    console.log('📊 Analysis result:', analysis);

    res.json({
      ...analysis,
      aiProcessed: true,
      source: 'gemini-2.0-flash',
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ AI note analysis error:', error);
    res.status(500).json({ message: 'Error analyzing note', error: error.message });
  }
});

// ============================================
// VOICE-TO-TEXT ENDPOINTS
// ============================================

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Process voice transcription from frontend
app.post('/api/voice/process-transcription', async (req, res) => {
  console.log('🎤 VOICE TRANSCRIPTION PROCESSING REQUEST');
  console.log('📝 Input:', req.body);
  
  try {
    const { transcription, language = 'en' } = req.body;
    
    if (!transcription) {
      return res.status(400).json({ message: 'Transcription text is required' });
    }

    console.log('🧠 Processing voice note with Gemini AI...');
    const processedVoice = await aiService.processVoiceNote(transcription, language);
    
    console.log('✅ VOICE PROCESSING COMPLETE!');
    console.log('📊 Processed voice:', processedVoice);

    res.json({
      success: true,
      ...processedVoice
    });
  } catch (error) {
    console.error('❌ Voice processing error:', error);
    res.status(500).json({ message: 'Error processing voice transcription', error: error.message });
  }
});

// Enhance raw transcription text
app.post('/api/voice/enhance-text', async (req, res) => {
  console.log('✨ TEXT ENHANCEMENT REQUEST');
  
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    console.log('🧠 Enhancing transcription with Gemini AI...');
    const enhancedText = await aiService.enhanceVoiceTranscription(text);
    
    console.log('✅ TEXT ENHANCEMENT COMPLETE!');

    res.json({
      success: true,
      originalText: text,
      enhancedText,
      enhancedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Text enhancement error:', error);
    res.status(500).json({ message: 'Error enhancing text', error: error.message });
  }
});

// Upload audio file for server-side transcription (future feature)
app.post('/api/voice/upload-audio', upload.single('audio'), async (req, res) => {
  console.log('🎵 AUDIO UPLOAD REQUEST');
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    console.log('📁 Audio file received:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    // For now, just acknowledge the upload
    // Future: Integrate with speech-to-text service
    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      fileInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      },
      note: 'Server-side transcription coming soon! Use browser speech recognition for now.'
    });
  } catch (error) {
    console.error('❌ Audio upload error:', error);
    res.status(500).json({ message: 'Error uploading audio', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;