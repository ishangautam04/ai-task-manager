// AI Services for Task Manager - Using Hugging Face & Gemini
const axios = require('axios');

class AIService {
  constructor() {
    // Free API keys from:
    // Google AI Studio: https://aistudio.google.com/
    // Hugging Face: https://huggingface.co/settings/tokens (free)
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.huggingFaceToken = process.env.HUGGINGFACE_TOKEN;
    
    // Hugging Face API endpoints (free)
    this.hfApiBase = 'https://api-inference.huggingface.co/models';
    
    // Pre-defined categories for task classification
    this.taskCategories = [
      'work', 'personal', 'health', 'finance', 'education', 
      'shopping', 'travel', 'entertainment', 'household', 'other'
    ];
  }

  // Smart Task Categorization using Hugging Face BERT
  async categorizeTaskWithHF(title, description) {
    try {
      const text = `${title} ${description || ''}`.trim();
      
      // Using facebook/bart-large-mnli for zero-shot classification
      const response = await axios.post(
        `${this.hfApiBase}/facebook/bart-large-mnli`,
        {
          inputs: text,
          parameters: {
            candidate_labels: this.taskCategories
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Return the category with highest confidence
      if (response.data && response.data.labels && response.data.labels.length > 0) {
        return {
          category: response.data.labels[0],
          confidence: response.data.scores[0],
          allPredictions: response.data.labels.slice(0, 3).map((label, idx) => ({
            category: label,
            confidence: response.data.scores[idx]
          }))
        };
      }
      
      return { category: 'other', confidence: 0.5 };
    } catch (error) {
      console.error('Hugging Face categorization error:', error.message);
      return this.fallbackCategorization(title, description);
    }
  }

  // Sentiment-based Priority Detection using Hugging Face
  async detectPriorityWithSentiment(title, description, dueDate) {
    try {
      const text = `${title} ${description || ''}`.trim();
      
      // Using cardiffnlp/twitter-roberta-base-sentiment-latest
      const sentimentResponse = await axios.post(
        `${this.hfApiBase}/cardiffnlp/twitter-roberta-base-sentiment-latest`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let priorityScore = 0.5; // Default medium priority
      
      if (sentimentResponse.data && sentimentResponse.data[0]) {
        const sentiment = sentimentResponse.data[0];
        
        // Find negative sentiment (usually indicates urgency/stress)
        const negativeScore = sentiment.find(s => s.label === 'LABEL_0')?.score || 0;
        const neutralScore = sentiment.find(s => s.label === 'LABEL_1')?.score || 0;
        const positiveScore = sentiment.find(s => s.label === 'LABEL_2')?.score || 0;
        
        // Higher negative sentiment = higher priority (urgent/stressful tasks)
        priorityScore = negativeScore * 0.7 + neutralScore * 0.3 + positiveScore * 0.1;
      }

      // Combine with keyword analysis and due date
      const keywordScore = this.analyzeUrgencyKeywords(text);
      const dateScore = this.analyzeDueDateUrgency(dueDate);
      
      const finalScore = (priorityScore * 0.4) + (keywordScore * 0.4) + (dateScore * 0.2);
      
      let priority = 'medium';
      if (finalScore > 0.7) priority = 'high';
      else if (finalScore < 0.3) priority = 'low';
      
      return {
        priority,
        confidence: Math.max(priorityScore, keywordScore),
        scores: {
          sentiment: priorityScore,
          keywords: keywordScore,
          dueDate: dateScore,
          final: finalScore
        }
      };
      
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      return this.fallbackPriorityDetection(title, description, dueDate);
    }
  }

  // Enhanced Task Parsing using Gemini
  async parseNaturalLanguageTask(text) {
    try {
      const prompt = `Parse this natural language text into a structured task. Extract title, description, due date (if mentioned), and any other relevant details. Return ONLY a valid JSON object with these fields: title, description, dueDate (ISO format if date mentioned, null otherwise), type (task/event/reminder), estimatedDuration (in minutes).

Text: "${text}"

JSON:`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }
      );

      const rawResponse = response.data.candidates[0].content.parts[0].text;
      
      // Clean up the response to extract JSON
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedTask = JSON.parse(jsonMatch[0]);
        
        // Enhance with AI categorization and priority
        const [categoryResult, priorityResult] = await Promise.all([
          this.categorizeTaskWithHF(parsedTask.title, parsedTask.description),
          this.detectPriorityWithSentiment(parsedTask.title, parsedTask.description, parsedTask.dueDate)
        ]);
        
        return {
          ...parsedTask,
          category: categoryResult.category,
          priority: priorityResult.priority,
          aiConfidence: {
            category: categoryResult.confidence,
            priority: priorityResult.confidence
          }
        };
      }
      
      return this.fallbackTaskParsing(text);
      
    } catch (error) {
      console.error('Gemini parsing error:', error.message);
      return this.fallbackTaskParsing(text);
    }
  }

  // Smart Task Suggestions using user patterns
  async generateSmartSuggestions(userTasks, currentDate) {
    try {
      const patterns = this.analyzeUserPatterns(userTasks);
      const suggestions = [];

      // Analyze incomplete tasks for suggestions
      const incompleteTasks = userTasks.filter(task => task.status !== 'completed');
      
      if (incompleteTasks.length > 0) {
        // Use Hugging Face to analyze task urgency
        for (let task of incompleteTasks.slice(0, 3)) {
          const priorityAnalysis = await this.detectPriorityWithSentiment(
            task.title, 
            task.description, 
            task.dueDate
          );
          
          if (priorityAnalysis.priority === 'high' && priorityAnalysis.confidence > 0.7) {
            suggestions.push({
              type: 'urgent_task',
              task: task,
              message: `"${task.title}" appears urgent based on AI analysis`,
              confidence: priorityAnalysis.confidence,
              recommendation: 'Consider prioritizing this task today'
            });
          }
        }
      }

      // Pattern-based suggestions
      const dayOfWeek = new Date(currentDate).getDay();
      if (patterns.weeklyPatterns[dayOfWeek] && patterns.weeklyPatterns[dayOfWeek].length > 0) {
        suggestions.push({
          type: 'pattern_suggestion',
          message: `You usually work on ${patterns.weeklyPatterns[dayOfWeek].join(', ')} tasks on ${this.getDayName(dayOfWeek)}s`,
          suggestedCategories: patterns.weeklyPatterns[dayOfWeek],
          confidence: 0.8
        });
      }

      // Overdue task analysis
      const overdueTasks = userTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date(currentDate) && task.status !== 'completed'
      );

      if (overdueTasks.length > 0) {
        suggestions.push({
          type: 'overdue_analysis',
          message: `${overdueTasks.length} overdue tasks need attention`,
          tasks: overdueTasks.slice(0, 3),
          recommendation: 'Consider rescheduling or breaking them into smaller tasks'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error.message);
      return [];
    }
  }

  // Fallback methods when AI services are unavailable
  fallbackCategorization(title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    const categoryKeywords = {
      work: ['meeting', 'project', 'deadline', 'client', 'report', 'presentation', 'email'],
      health: ['doctor', 'dentist', 'gym', 'exercise', 'appointment', 'medicine', 'checkup'],
      finance: ['bank', 'payment', 'bill', 'invoice', 'budget', 'money', 'tax'],
      education: ['study', 'course', 'learn', 'homework', 'exam', 'research', 'book'],
      shopping: ['buy', 'purchase', 'store', 'groceries', 'market', 'order'],
      household: ['clean', 'repair', 'maintenance', 'organize', 'laundry', 'dishes'],
      travel: ['flight', 'hotel', 'vacation', 'trip', 'booking', 'travel'],
      entertainment: ['movie', 'game', 'party', 'concert', 'show', 'fun']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return { category, confidence: 0.7 };
      }
    }
    
    return { category: 'personal', confidence: 0.5 };
  }

  fallbackPriorityDetection(title, description, dueDate) {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'deadline', 'important', 'rush'];
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    let score = 0.5;
    
    // Check urgent keywords
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      score += 0.3;
    }
    
    // Check due date
    if (dueDate) {
      const daysDiff = (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) score += 0.4;
      else if (daysDiff <= 3) score += 0.2;
    }
    
    let priority = 'medium';
    if (score > 0.7) priority = 'high';
    else if (score < 0.4) priority = 'low';
    
    return { priority, confidence: 0.6, scores: { final: score } };
  }

  fallbackTaskParsing(text) {
    const words = text.split(' ');
    const title = words.length > 10 ? words.slice(0, 10).join(' ') + '...' : text;
    const description = words.length > 10 ? text : '';
    
    // Simple date extraction
    let dueDate = null;
    const datePatterns = [
      /tomorrow/i,
      /today/i,
      /next week/i,
      /\d{1,2}\/\d{1,2}/,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    ];
    
    for (const pattern of datePatterns) {
      if (pattern.test(text)) {
        const now = new Date();
        if (/tomorrow/i.test(text)) {
          dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        } else if (/today/i.test(text)) {
          dueDate = now.toISOString();
        }
        break;
      }
    }
    
    return {
      title,
      description,
      dueDate,
      type: 'task',
      estimatedDuration: 30,
      category: 'general',
      priority: 'medium'
    };
  }

  // Keyword-based urgency analysis
  analyzeUrgencyKeywords(text) {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'deadline', 'important', 'rush', 'immediately'];
    const moderateKeywords = ['soon', 'priority', 'needed', 'required', 'must'];
    const lowKeywords = ['maybe', 'eventually', 'sometime', 'when possible', 'optional'];
    
    const lowerText = text.toLowerCase();
    
    const urgentCount = urgentKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const moderateCount = moderateKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const lowCount = lowKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    if (urgentCount > 0) return 0.9;
    if (moderateCount > 0) return 0.6;
    if (lowCount > 0) return 0.2;
    
    return 0.5; // neutral
  }

  // Due date urgency analysis
  analyzeDueDateUrgency(dueDate) {
    if (!dueDate) return 0.3;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = (due - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 1.0; // overdue
    if (diffHours < 24) return 0.9; // due within 24 hours
    if (diffHours < 72) return 0.7; // due within 3 days
    if (diffHours < 168) return 0.5; // due within a week
    
    return 0.3; // due later
  }

  // Analyze user productivity patterns
  analyzeUserPatterns(tasks) {
    const patterns = {
      weeklyPatterns: {},
      categoryFrequency: {},
      completionTimes: {},
      productiveHours: {}
    };

    tasks.forEach(task => {
      // Weekly patterns
      if (task.createdAt) {
        const dayOfWeek = new Date(task.createdAt).getDay();
        if (!patterns.weeklyPatterns[dayOfWeek]) patterns.weeklyPatterns[dayOfWeek] = [];
        if (task.category && !patterns.weeklyPatterns[dayOfWeek].includes(task.category)) {
          patterns.weeklyPatterns[dayOfWeek].push(task.category);
        }
      }

      // Category frequency
      if (task.category) {
        patterns.categoryFrequency[task.category] = (patterns.categoryFrequency[task.category] || 0) + 1;
      }

      // Completion time analysis
      if (task.status === 'completed' && task.createdAt && task.updatedAt) {
        const completionTime = new Date(task.updatedAt) - new Date(task.createdAt);
        const category = task.category || 'other';
        if (!patterns.completionTimes[category]) patterns.completionTimes[category] = [];
        patterns.completionTimes[category].push(completionTime);
      }
    });

    return patterns;
  }

  // Estimate task completion time
  async estimateCompletionTime(title, description, category, userPatterns) {
    // Use historical data if available
    if (userPatterns.completionTimes && userPatterns.completionTimes[category] && userPatterns.completionTimes[category].length > 0) {
      const avgTime = userPatterns.completionTimes[category].reduce((a, b) => a + b, 0) / userPatterns.completionTimes[category].length;
      return Math.round(avgTime / (1000 * 60)); // Convert to minutes
    }

    // Fallback to keyword-based estimation
    const text = (title + ' ' + (description || '')).toLowerCase();
    const quickKeywords = ['call', 'email', 'text', 'quick', 'check', 'send'];
    const mediumKeywords = ['meeting', 'review', 'plan', 'write', 'create', 'update'];
    const longKeywords = ['research', 'develop', 'design', 'analyze', 'report', 'study'];

    if (quickKeywords.some(keyword => text.includes(keyword))) return 15; // 15 minutes
    if (mediumKeywords.some(keyword => text.includes(keyword))) return 60; // 1 hour
    if (longKeywords.some(keyword => text.includes(keyword))) return 180; // 3 hours

    return 30; // Default 30 minutes
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }
}

module.exports = AIService;
