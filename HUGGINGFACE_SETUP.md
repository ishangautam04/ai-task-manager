# Hugging Face + Gemini AI Integration Setup

This guide shows you how to set up completely free AI features using Hugging Face Transformers and Google Gemini.

## 🎯 **What You Get**

### 1. **Smart Task Categorization** (Hugging Face BERT)
- **Model**: `facebook/bart-large-mnli`
- **Categories**: work, personal, health, finance, education, shopping, travel, entertainment, household
- **Confidence Scores**: Know how certain the AI is about categorization

### 2. **Sentiment-Based Priority Detection** (Hugging Face RoBERTa)
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Analysis**: Negative sentiment = Higher priority (stress/urgency indicators)
- **Smart Scoring**: Combines sentiment + keywords + due dates

### 3. **Natural Language Task Parsing** (Google Gemini)
- **Input**: "Call dentist urgently tomorrow about pain"
- **Output**: Structured task with extracted date, priority, category
- **Free Tier**: 15 requests per minute

### 4. **Batch AI Analysis**
- **Process**: Up to 10 tasks at once
- **Features**: Re-categorize and re-prioritize existing tasks
- **Recommendations**: Suggests which tasks need updates

## 🔑 **Getting Free API Keys**

### 1. Hugging Face Token (Completely Free!)
1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account (free)
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Name: "TaskManager" 
6. Type: "Read"
7. Copy the token

### 2. Google Gemini API Key (Free Tier)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google account
3. Click "Get API key"
4. Create new API key
5. Copy the key

## 🛠️ **Installation Steps**

### 1. Update Environment Variables
Add these to your `backend/.env` file:

```env
# Replace 'your_xxx_here' with actual keys
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_TOKEN=your_huggingface_token_here
```

### 2. Restart Your Servers
```bash
# Backend
cd backend
npm run dev

# Frontend (in new terminal)
cd frontend
npm start
```

## 📊 **How It Works**

### Task Categorization Flow
```
User Input: "Buy groceries and cook dinner"
↓
Hugging Face BART-MNLI Model
↓
Categories Analyzed: [shopping, personal, household, ...]
↓
Result: "shopping" (85% confidence)
```

### Priority Detection Flow
```
User Input: "Emergency dentist appointment ASAP!"
↓
RoBERTa Sentiment Analysis → High negative sentiment (stress)
↓
Keyword Analysis → "emergency", "ASAP" detected
↓
Result: "high" priority (92% confidence)
```

## 🎮 **Testing the Features**

### 1. Natural Language Task Creation
Try these examples:

**Urgent Work Task:**
```
"Finish quarterly report by Friday - client is waiting!"
Expected: High priority, work category
```

**Casual Personal Task:**
```
"Maybe organize my closet when I have free time"
Expected: Low priority, household category
```

**Health Emergency:**
```
"Call doctor immediately about chest pain"
Expected: High priority, health category
```

### 2. Batch Analysis
1. Create several tasks with different content
2. Click "Analyze Tasks" in the Batch AI Analysis section
3. See AI suggestions for better categorization/prioritization

## 🔬 **Understanding AI Confidence Scores**

### Confidence Levels
- **90%+**: Very reliable, accept suggestion
- **70-89%**: Good confidence, likely correct
- **50-69%**: Moderate confidence, review manually
- **<50%**: Low confidence, fallback used

### What Affects Confidence
- **Clear keywords**: "doctor appointment" → high health confidence
- **Ambiguous content**: "meeting" → lower confidence (work vs personal?)
- **Context clues**: "urgent deadline" → high priority confidence

## 🚀 **API Endpoints Added**

### 1. Parse Natural Language
```http
POST /api/ai/parse-task
{
  "text": "Call dentist urgently tomorrow about pain"
}

Response:
{
  "title": "Call dentist",
  "description": "About pain",
  "dueDate": "2025-08-20T...",
  "category": "health",
  "priority": "high",
  "aiConfidence": {
    "category": 0.89,
    "priority": 0.92
  }
}
```

### 2. Enhance Existing Task
```http
POST /api/ai/enhance-task
{
  "title": "Team meeting",
  "description": "Discuss urgent project issues",
  "dueDate": "2025-08-20T10:00:00Z"
}

Response:
{
  "suggestedCategory": "work",
  "categoryConfidence": 0.95,
  "suggestedPriority": "high",
  "priorityConfidence": 0.87,
  "alternativeCategories": [
    {"category": "work", "confidence": 0.95},
    {"category": "personal", "confidence": 0.03}
  ]
}
```

### 3. Batch Analysis
```http
POST /api/ai/analyze-batch
{
  "tasks": [
    {"title": "Buy milk", "category": "work", "priority": "high"},
    {"title": "Fix urgent bug", "category": "personal", "priority": "low"}
  ]
}

Response:
{
  "analysis": [
    {
      "taskId": "...",
      "title": "Buy milk",
      "suggestedCategory": "shopping",
      "suggestedPriority": "low",
      "recommendations": {
        "shouldUpdateCategory": true,
        "shouldUpdatePriority": true
      }
    }
  ]
}
```

## 🎨 **Integration with Your App**

### Option 1: Replace Existing Task Form
```javascript
// In your App.js, replace TaskForm with:
import HuggingFaceTaskCreator from './HuggingFaceTaskCreator';

// Then use:
<HuggingFaceTaskCreator 
  onTaskCreate={handleCreateTask}
  tasks={tasks}
/>
```

### Option 2: Add as New Feature
```javascript
// Add as a new tab/section
{currentView === 'ai-tools' && (
  <HuggingFaceTaskCreator 
    onTaskCreate={handleCreateTask}
    tasks={tasks}
  />
)}
```

## 📈 **Free Usage Limits**

### Hugging Face
- **Limit**: ~1000 requests/month per model (very generous)
- **Rate Limit**: ~1 request/second
- **Cost**: Completely free forever
- **Tip**: We add small delays between requests to respect limits

### Google Gemini
- **Limit**: 15 requests/minute
- **Rate Limit**: No daily limit on free tier
- **Cost**: Free for personal use
- **Tip**: Used only for natural language parsing

## 🔧 **Customization Options**

### Add More Categories
Edit the `taskCategories` array in `ai-services.js`:
```javascript
this.taskCategories = [
  'work', 'personal', 'health', 'finance', 'education', 
  'shopping', 'travel', 'entertainment', 'household', 
  'fitness', 'social', 'creative', 'other'  // Add more here
];
```

### Adjust Priority Keywords
Modify the keyword arrays in `analyzeUrgencyKeywords()`:
```javascript
const urgentKeywords = [
  'urgent', 'asap', 'emergency', 'critical', 'deadline', 
  'immediately', 'rush', 'pressing'  // Add your keywords
];
```

### Change Confidence Thresholds
Adjust when to show AI suggestions:
```javascript
// In the frontend component
{aiSuggestions.categoryConfidence > 0.8 && (
  <div className="bg-green-100">High confidence suggestion!</div>
)}
```

## 🛟 **Troubleshooting**

### Common Issues

1. **"Model loading" errors**
   - Hugging Face models need ~30 seconds to warm up
   - First request might be slow, subsequent ones are fast
   - Solution: Show loading state, retry after delay

2. **Rate limit errors**
   - Hugging Face: Wait 1 second between requests
   - Gemini: Max 15 requests/minute
   - Solution: Our code includes automatic delays

3. **Low confidence scores**
   - Ambiguous task descriptions get lower scores
   - Solution: Encourage users to be more specific

### Debugging Tips

```javascript
// Add to your backend to log AI responses
console.log('HF Response:', response.data);
console.log('Confidence:', categoryResult.confidence);
```

## 🎯 **Real-World Examples**

### Input → AI Analysis

1. **"Emergency dentist appointment ASAP for severe pain"**
   - Category: health (confidence: 98%)
   - Priority: high (confidence: 95%)
   - Reasoning: Health keywords + urgency indicators

2. **"Maybe organize closet this weekend if I have time"**
   - Category: household (confidence: 87%)
   - Priority: low (confidence: 91%)
   - Reasoning: Household task + optional language

3. **"Client presentation deadline tomorrow morning"**
   - Category: work (confidence: 94%)
   - Priority: high (confidence: 89%)
   - Reasoning: Work context + tight deadline

4. **"Research vacation destinations for next year"**
   - Category: travel (confidence: 92%)
   - Priority: low (confidence: 83%)
   - Reasoning: Travel keywords + distant timeline

## 🚀 **Next Steps**

1. **Get your API keys** (5 minutes)
2. **Update .env file** (1 minute)
3. **Restart servers** (1 minute)
4. **Test with examples above** (10 minutes)
5. **Integrate into your app** (15 minutes)

Total setup time: **~30 minutes for powerful AI features!**

## 💡 **Pro Tips**

1. **Be Specific**: "Call dentist about root canal" vs "call dentist"
2. **Use Context**: "Urgent work deadline" vs just "deadline"
3. **Include Timing**: "tomorrow", "next week", "ASAP"
4. **Check Confidence**: High confidence = trust AI, low = review manually

Happy AI-powered task managing! 🤖✨
