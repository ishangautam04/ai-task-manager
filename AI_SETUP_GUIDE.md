# AI/ML Integration Setup Guide

This guide will help you set up the AI and ML features in your Task Manager application using free services.

## 🔑 Getting Free AI API Keys

### 1. OpenAI API (GPT-3.5)
- **Free Credits**: $5 worth of free credits for new accounts
- **Setup Steps**:
  1. Go to [OpenAI Platform](https://platform.openai.com/)
  2. Create an account or sign in
  3. Navigate to API Keys section
  4. Click "Create new secret key"
  5. Copy the key and add it to your `.env` file

### 2. Google AI Studio (Gemini)
- **Free Tier**: 15 requests per minute
- **Setup Steps**:
  1. Go to [Google AI Studio](https://aistudio.google.com/)
  2. Sign in with your Google account
  3. Create a new API key
  4. Copy the key and add it to your `.env` file

## 🛠️ Installation Steps

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install axios
   ```

2. **Update Environment Variables**:
   Add these lines to your `backend/.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Restart Backend Server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install @tensorflow/tfjs
   ```

2. **Restart Frontend Server**:
   ```bash
   npm start
   ```

## 🤖 AI Features Included

### 1. **Natural Language Task Creation**
- **Input**: "Call dentist tomorrow at 2pm about cleaning"
- **Output**: Structured task with title, due date, category, priority
- **Powered by**: OpenAI GPT-3.5

### 2. **Intelligent Task Categorization**
- **Auto-categorizes**: work, personal, health, finance, education, etc.
- **Powered by**: Google Gemini

### 3. **Smart Priority Prediction**
- **Analyzes**: Keywords, due dates, context
- **Suggests**: High, Medium, or Low priority
- **Powered by**: Custom algorithm + AI

### 4. **Productivity Pattern Analysis**
- **Tracks**: Best days, peak hours, completion rates
- **Provides**: Personalized recommendations
- **Powered by**: TensorFlow.js (client-side)

### 5. **Optimal Timing Suggestions**
- **Predicts**: Best time to work on specific tasks
- **Considers**: User patterns, task complexity, deadlines
- **Powered by**: Machine Learning model

### 6. **Task Completion Time Estimation**
- **Estimates**: How long tasks will take
- **Learns**: From user's historical data
- **Improves**: Over time with more data

## 📊 API Endpoints Added

### AI-Powered Task Parsing
```http
POST /api/ai/parse-task
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "Schedule meeting with team tomorrow at 3pm"
}
```

### Task Enhancement
```http
POST /api/ai/enhance-task
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Team meeting",
  "description": "Discuss project progress",
  "dueDate": "2025-08-20T15:00:00Z"
}
```

### Productivity Suggestions
```http
GET /api/ai/suggestions
Authorization: Bearer <token>
```

### Pattern Analysis
```http
GET /api/ai/patterns
Authorization: Bearer <token>
```

## 🔧 Usage Examples

### 1. Creating Tasks with Natural Language
```javascript
// Frontend usage
const response = await fetch('/api/ai/parse-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: "Finish the report by Friday and email it to the client"
  })
});

const parsedTask = await response.json();
// Result: {
//   title: "Finish the report",
//   description: "Email it to the client",
//   dueDate: "2025-08-23T23:59:59Z",
//   priority: "high",
//   category: "work"
// }
```

### 2. Getting Productivity Insights
```javascript
import ProductivityML from './ProductivityML';

const ml = new ProductivityML();
await ml.initializeModel();

const insights = ml.analyzeProductivityPatterns(userTasks);
// Result: {
//   completionRate: 85,
//   bestDay: "Tuesday",
//   bestHour: "10:00",
//   recommendations: ["You're most productive on Tuesdays..."]
// }
```

## 🚀 Advanced Features

### Client-Side Machine Learning
- **No API calls needed**: Runs entirely in the browser
- **Privacy-focused**: Your data never leaves your device
- **Real-time predictions**: Instant feedback and suggestions

### Adaptive Learning
- **Learns from your behavior**: Gets better over time
- **Personalized suggestions**: Tailored to your work patterns
- **Smart scheduling**: Suggests optimal times for different tasks

## 🔒 Privacy & Security

- **API Keys**: Stored securely in environment variables
- **Local ML**: TensorFlow.js runs locally, no data sent to servers
- **Encrypted Storage**: All user data is encrypted
- **GDPR Compliant**: Full control over your data

## 💡 Free Service Limits

### OpenAI
- **Free Tier**: $5 in credits (usually lasts 3-6 months for this use case)
- **Rate Limit**: 3 requests per minute
- **Usage Tips**: Cache results, batch requests

### Google AI Studio
- **Free Tier**: 15 requests per minute
- **No credit limit**: Completely free for personal use
- **Usage Tips**: Use for categorization and simple tasks

### TensorFlow.js
- **Completely Free**: No limits
- **Runs Locally**: No API calls needed
- **Usage Tips**: Perfect for privacy-sensitive features

## 🛟 Troubleshooting

### Common Issues

1. **API Key Errors**:
   - Double-check your API keys in `.env`
   - Ensure no extra spaces or quotes
   - Restart your server after adding keys

2. **CORS Errors**:
   - Make sure backend is running on port 5000
   - Check proxy setting in frontend package.json

3. **TensorFlow.js Issues**:
   - Clear browser cache
   - Check browser console for errors
   - Ensure HTTPS if hosting (required for some ML features)

### Fallback Options
- If AI services fail, the app falls back to rule-based algorithms
- All features work offline with reduced intelligence
- User data is never lost

## 🔄 Future Enhancements

### Planned AI Features
1. **Voice Input**: "Hey Task Manager, add a meeting for tomorrow"
2. **Smart Notifications**: AI-powered reminder timing
3. **Habit Recognition**: Detect and suggest recurring patterns
4. **Goal Setting**: AI-assisted goal creation and tracking
5. **Team Intelligence**: Collaborative AI for team productivity

### Model Improvements
1. **Custom Training**: Train models on your specific data
2. **Advanced Predictions**: More sophisticated ML algorithms
3. **Integration APIs**: Connect with calendar, email, etc.
4. **Sentiment Analysis**: Understand task urgency from tone

## 📈 Monitoring Usage

Track your AI usage to stay within free limits:

```javascript
// Add this to your backend to monitor API calls
let openaiCalls = 0;
let geminiCalls = 0;

// Track before each API call
console.log(`OpenAI calls today: ${openaiCalls}`);
console.log(`Gemini calls today: ${geminiCalls}`);
```

Happy coding with AI! 🚀
