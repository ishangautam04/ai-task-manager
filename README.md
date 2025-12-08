# 🤖 AI-Powered Task Manager & Notes Application

An intelligent productivity application that combines task management and note-taking with cutting-edge AI capabilities powered by Google's Gemini 2.0 Flash. Transform your workflow with natural language processing, voice-to-text, and smart analysis features.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![AI Powered](https://img.shields.io/badge/AI-Gemini%202.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🗣️ Voice-to-Text
- Record notes and tasks using speech recognition
- Browser-based Web Speech API with Google Cloud Speech fallback
- Real-time transcription with smart punctuation

### 🧠 AI Intelligence (Powered by Gemini 2.0 Flash)
- **Natural Language Task Creation**: "Call dentist tomorrow at 2pm urgently" → Structured task
- **Smart Categorization**: Automatic organization into work, personal, health, finance, etc.
- **Priority Detection**: AI analyzes urgency from your language and tone
- **Content Summarization**: Get concise summaries of lengthy notes
- **Sentiment & Mood Analysis**: Understand emotional context in your writing
- **Semantic Search**: Find related content across tasks and notes

### 📝 Smart Note-Taking
- Rich text editor with markdown support
- AI-powered analysis and insights
- Auto-categorization and tag suggestions
- Key points extraction
- Reading time estimation
- Complexity analysis

### ✅ Intelligent Task Management
- Multiple view modes: Dashboard, List, Calendar, Kanban
- Advanced filtering by status, priority, category, date
- Smart task parsing from natural language
- Due date reminders and notifications
- Progress tracking and analytics

### 📊 Analytics Dashboard
- Productivity insights and completion rates
- Pattern recognition for peak productivity hours
- Category performance tracking
- Visual charts and statistics

### 🔐 Secure Authentication
- JWT-based user authentication
- Secure password hashing with bcrypt
- Demo mode for testing without registration
- User-specific data isolation

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Cloud NoSQL)
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **AI Integration**: Google Gemini 2.0 Flash SDK (`@google/genai`)
- **Development**: Nodemon for hot-reloading

### Frontend
- **Framework**: React 18 with Hooks
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Calendar**: React Big Calendar
- **HTTP Client**: Axios
- **Voice Recognition**: Web Speech API

### AI/ML
- **Primary AI**: Google Gemini 2.0 Flash (15 req/min free tier)
- **Speech Recognition**: Google Cloud Speech API
- **Fallback**: Rule-based algorithms for offline functionality

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier available)
- Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/task-manager-app.git
cd task-manager-app
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**
```bash
cd ../backend
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

5. **Start the backend server**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

6. **Start the frontend (in a new terminal)**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

## 🔑 Getting Free API Keys

### Google Gemini AI (Required)
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy your API key to `.env` file
- **Free Tier**: 15 requests per minute

### MongoDB Atlas (Required)
1. Visit [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (select free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string to `.env` file
6. Replace `<password>` with your database user password
- **Free Tier**: 512MB storage

### Hugging Face (Optional)
1. Visit [Hugging Face](https://huggingface.co/settings/tokens)
2. Create an account
3. Generate a new token
4. Add to `.env` file (optional for additional features)

## 📁 Project Structure

```
task-manager-app/
├── backend/
│   ├── server.js                    # Main Express server
│   ├── improved-ai-services.js      # Gemini AI integration
│   ├── package.json                 # Backend dependencies
│   ├── .env.example                 # Environment template
│   └── .env                         # Your secrets (DO NOT COMMIT)
│
├── frontend/
│   ├── src/
│   │   ├── App.js                   # Main React application
│   │   ├── ImprovedAITaskCreator.js # AI task creation UI
│   │   ├── VoiceRecorder.js         # Voice-to-text component
│   │   ├── NotesManager.js          # Notes management UI
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles
│   ├── public/
│   ├── package.json                 # Frontend dependencies
│   └── .gitignore
│
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

## 🎯 Key Features Walkthrough

### Creating Tasks with AI
1. Click "Create with AI" button
2. Type or speak naturally: "Finish project report by Friday, high priority"
3. AI automatically extracts:
   - Task title: "Finish project report"
   - Due date: Next Friday
   - Priority: High
   - Category: Work
4. Review and save!

### Voice Note-Taking
1. Open Notes section
2. Click microphone icon
3. Start speaking - transcription happens in real-time
4. AI automatically:
   - Summarizes your note
   - Detects sentiment and mood
   - Suggests categories and tags
   - Extracts key points

### Smart Search
1. Type natural language query: "meeting notes from last week"
2. AI performs semantic search across all notes
3. Results ranked by relevance with explanations

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/demo-login` - Demo access

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/ai/parse` - Parse task with AI

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/ai/analyze-note` - Analyze note with AI
- `POST /api/ai/semantic-search` - Smart note search

### AI Features
- `POST /api/ai/speech-to-text` - Transcribe audio

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt (10 rounds)
- Environment variable protection
- MongoDB injection prevention
- CORS configuration
- Rate limiting on AI endpoints

## 🎨 Screenshots

*(Add screenshots of your app here)*

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- Voice recognition requires HTTPS in production (browser security)
- Gemini API has rate limits on free tier (15 req/min)
- Large notes may take longer to analyze

## 🚧 Future Enhancements

- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Email notifications
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Export to PDF/CSV
- [ ] Advanced analytics dashboard
- [ ] Team workspaces

## 💡 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Verify Node.js version (v14+)
- Run `npm install` in backend folder

### AI features not working
- Verify `GEMINI_API_KEY` in `.env`
- Check API quota limits
- Review backend console for error messages

### Voice recording not working
- Ensure HTTPS connection (required by browsers)
- Check microphone permissions
- Try different browser (Chrome recommended)

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language understanding
- MongoDB Atlas for cloud database hosting
- React team for the amazing framework
- Tailwind CSS for beautiful, responsive design

---

**Made with ❤️ using MERN Stack + AI**

*Star ⭐ this repo if you find it useful!*
