const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

class ImprovedAIService {
  constructor() {
    // Initialize Gemini with new SDK (official format)
    this.geminiClient = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        // The client gets the API key from the environment variable `GEMINI_API_KEY`.
        this.geminiClient = new GoogleGenAI({});
        console.log('✅ Gemini initialized successfully with official SDK format');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error.message);
      }
    } else {
      console.log('⚠️ GEMINI_API_KEY not found in environment variables');
    }

    // Hugging Face API configuration
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY;
    this.hfBaseUrl = 'https://api-inference.huggingface.co/models';
    
    // Model endpoints
    this.models = {
      categorization: 'facebook/bart-large-mnli',
      sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      textGeneration: 'microsoft/DialoGPT-medium'
    };

    console.log('🤖 ImprovedAIService initialized');
  }

  // ============================================
  // VOICE-TO-TEXT METHODS
  // ============================================

  // Process voice notes using Gemini for transcription and enhancement
  async processVoiceNote(audioText, language = 'en') {
    console.log(`🎤 Processing voice note in language: ${language}`);
    
    if (!this.geminiClient) {
      console.log('⚠️ Gemini client not available, using fallback processing');
      return this.createFallbackVoiceProcessing(audioText);
    }

    try {
      const prompt = `
You are a voice note processing specialist. Clean up and enhance the following transcribed voice note.

Original transcription: "${audioText}"
Language: ${language}

Your tasks:
1. Fix grammar, punctuation, and formatting
2. Remove filler words (um, uh, like, you know, etc.)
3. Structure the content with proper paragraphs
4. Preserve the speaker's intent and meaning
5. Add appropriate capitalization and punctuation
6. Suggest a concise title for the note

Return ONLY a valid JSON object:
{
  "cleanedText": "Cleaned and formatted version of the transcription",
  "suggestedTitle": "A concise title for this note",
  "wordCount": number,
  "confidence": number_0_to_1,
  "detectedTopics": ["topic1", "topic2"],
  "improvements": "Brief description of what was improved",
  "originalLength": number,
  "cleanedLength": number
}

Respond with ONLY the JSON object:`;

      console.log('🚀 GEMINI VOICE PROCESSING STARTING...');
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      console.log('📥 Gemini voice processing response received!');
      const responseText = response.text || '';
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const processed = JSON.parse(jsonMatch[0]);
      console.log('✅ Voice note processing completed successfully');
      
      return {
        ...processed,
        aiProcessed: true,
        source: 'gemini-2.0-flash',
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 Gemini voice processing error:', error.message);
      return this.createFallbackVoiceProcessing(audioText);
    }
  }

  // Smart punctuation and formatting for voice notes
  async enhanceVoiceTranscription(text) {
    console.log('✨ Enhancing voice transcription with AI...');
    
    if (!this.geminiClient) {
      return this.createBasicTextEnhancement(text);
    }

    try {
      const prompt = `
Add proper punctuation, capitalization, and formatting to this voice transcription while preserving the original meaning:

"${text}"

Rules:
- Add periods, commas, question marks, exclamation points
- Capitalize proper nouns and sentence beginnings
- Break into logical paragraphs if needed
- Remove excessive filler words
- Keep the natural speaking tone

Return only the enhanced text without quotes or additional formatting:`;

      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      const enhancedText = response.text?.trim() || text;
      console.log('✅ Voice transcription enhanced');
      
      return enhancedText;

    } catch (error) {
      console.error('💥 Voice enhancement error:', error.message);
      return this.createBasicTextEnhancement(text);
    }
  }

  // Fallback methods for voice processing
  createFallbackVoiceProcessing(audioText) {
    const wordCount = audioText.split(' ').length;
    const cleanedText = audioText
      .replace(/\b(um|uh|like|you know|actually)\b/gi, '') // Remove filler words
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();
    
    return {
      cleanedText,
      suggestedTitle: cleanedText.substring(0, 50) + '...',
      wordCount,
      confidence: 0.7,
      detectedTopics: ['general'],
      improvements: 'Basic cleaning applied - removed filler words and extra spaces',
      originalLength: audioText.length,
      cleanedLength: cleanedText.length,
      aiProcessed: false,
      source: 'fallback',
      processedAt: new Date().toISOString()
    };
  }

  createBasicTextEnhancement(text) {
    // Basic punctuation and capitalization
    let enhanced = text.charAt(0).toUpperCase() + text.slice(1);
    enhanced = enhanced.replace(/([.!?])\s*([a-z])/g, (match, punct, letter) => punct + ' ' + letter.toUpperCase());
    
    if (!enhanced.match(/[.!?]$/)) {
      enhanced += '.';
    }
    
    return enhanced;
  }

  // ============================================
  // NOTE ANALYSIS METHODS
  // ============================================

  // Comprehensive note analysis using Gemini
  async analyzeNote(title, content, analysisTypes = ['categorize', 'summarize', 'sentiment']) {
    console.log(`🧠 Analyzing note: "${title}" with types: ${analysisTypes.join(', ')}`);
    
    if (!this.geminiClient) {
      console.log('⚠️ Gemini client not available, using fallback analysis');
      return this.createFallbackNoteAnalysis(title, content);
    }

    try {
      const prompt = `
You are an intelligent note analysis assistant. Analyze the following note and provide comprehensive insights.

Title: "${title}"
Content: "${content}"

Provide analysis for: ${analysisTypes.join(', ')}

Return ONLY a valid JSON object with these exact fields:
{
  "summary": "Brief 2-3 sentence summary of the note",
  "sentiment": "positive|negative|neutral",
  "mood": "excited|calm|frustrated|focused|creative|analytical|stressed|optimistic",
  "suggestedCategory": "work|personal|education|health|finance|travel|ideas|meetings|projects|research",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "keyPoints": ["important point 1", "important point 2"],
  "readingTime": number,
  "complexity": "simple|medium|complex",
  "insights": "Additional insights or recommendations",
  "connections": ["potential connections to other topics"]
}

Respond with ONLY the JSON object:`;

      console.log('🚀 GEMINI NOTE ANALYSIS STARTING...');
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      console.log('📥 Gemini response received for note analysis!');
      const responseText = response.text || '';
      console.log('📝 Raw Gemini response:', responseText.substring(0, 300) + '...');
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log('✅ Note analysis parsed successfully');
      
      return {
        ...analysis,
        aiProcessed: true,
        source: 'gemini-2.0-flash',
        confidence: 0.9
      };

    } catch (error) {
      console.error('💥 Gemini note analysis error:', error.message);
      return this.createFallbackNoteAnalysis(title, content);
    }
  }

  // Semantic search through notes
  async semanticSearchNotes(query, notes) {
    console.log(`🔍 Performing semantic search for: "${query}"`);
    
    if (!this.geminiClient || !notes || notes.length === 0) {
      console.log('⚠️ Gemini client not available or no notes, using fallback search');
      return this.createFallbackSearch(query, notes);
    }

    try {
      // Create a summary of all notes for context
      const noteSummaries = notes.map(note => ({
        id: note._id,
        title: note.title,
        content: note.content.substring(0, 200) + '...',
        category: note.category,
        tags: note.tags
      }));

      const prompt = `
You are a semantic search expert. Find the most relevant notes for the given query.

Query: "${query}"

Available Notes:
${JSON.stringify(noteSummaries, null, 2)}

Analyze semantic similarity, context, and relevance. Return the most relevant notes with relevance scores.

Return ONLY a valid JSON object:
{
  "results": [
    {
      "noteId": "note_id",
      "relevanceScore": number_0_to_1,
      "relevanceReason": "Why this note is relevant",
      "matchedContent": "Specific content that matches"
    }
  ],
  "searchInsights": "Additional insights about the search",
  "suggestedQueries": ["related query 1", "related query 2"]
}

Sort by relevanceScore (highest first). Respond with ONLY the JSON object:`;

      console.log('🚀 GEMINI SEMANTIC SEARCH STARTING...');
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const searchResults = JSON.parse(jsonMatch[0]);
      console.log('✅ Semantic search completed');
      
      // Merge with original note data
      const enrichedResults = searchResults.results.map(result => {
        const originalNote = notes.find(note => note._id.toString() === result.noteId);
        return {
          ...result,
          note: originalNote
        };
      }).filter(result => result.note); // Remove any that couldn't be matched

      return enrichedResults;

    } catch (error) {
      console.error('💥 Gemini semantic search error:', error.message);
      return this.createFallbackSearch(query, notes);
    }
  }

  // Fallback methods for when Gemini is unavailable
  createFallbackNoteAnalysis(title, content) {
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    return {
      summary: content.substring(0, 100) + '...',
      sentiment: 'neutral',
      mood: 'calm',
      suggestedCategory: 'general',
      suggestedTags: title.toLowerCase().split(' ').slice(0, 3),
      keyPoints: [content.substring(0, 50) + '...'],
      readingTime,
      complexity: wordCount > 500 ? 'complex' : wordCount > 200 ? 'medium' : 'simple',
      insights: 'AI analysis not available - using basic text analysis',
      connections: [],
      aiProcessed: false,
      source: 'fallback'
    };
  }

  createFallbackSearch(query, notes) {
    if (!notes) return [];
    
    const queryLower = query.toLowerCase();
    const results = notes
      .map(note => {
        let score = 0;
        if (note.title.toLowerCase().includes(queryLower)) score += 0.8;
        if (note.content.toLowerCase().includes(queryLower)) score += 0.6;
        if (note.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 0.4;
        
        return {
          noteId: note._id,
          relevanceScore: score,
          relevanceReason: 'Basic text matching',
          matchedContent: note.content.substring(0, 100) + '...',
          note
        };
      })
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  // Enhanced task parsing with new Gemini SDK
  async parseNaturalLanguageTask(text) {
    console.log(`🧠 Parsing natural language: "${text}"`);
    
    // Try Gemini first with new SDK
    if (this.geminiClient) {
      try {
        return await this.parseWithGemini(text);
      } catch (error) {
        console.warn('⚠️ Gemini parsing failed, using fallback:', error.message);
      }
    }
    
    // Fallback to simple parsing
    return this.createFallbackTask(text);
  }

  // Use new Gemini SDK with streaming and better error handling
  async parseWithGemini(text) {
    console.log('🚀 GEMINI API CALL STARTING...');
    const prompt = `
You are an intelligent task parser. Analyze the following natural language text and extract structured task information.

Consider urgency indicators like: "ASAP", "urgent", "emergency", "immediately", "rush", "critical"
Consider time indicators like: "today", "tomorrow", "next week", "Monday", "by 5pm", "deadline"
Consider context clues for categorization.

Text: "${text}"

Extract and return ONLY a valid JSON object with these exact fields:
{
  "title": "Brief, clear task title",
  "description": "Additional details if any, empty string if none", 
  "dueDate": "ISO date string if time mentioned, null otherwise",
  "type": "task|event|reminder",
  "estimatedDuration": number (minutes),
  "urgency": "low|medium|high",
  "category": "work|personal|health|finance|education|shopping|travel|entertainment|household|emergency",
  "reasoning": "Brief explanation of your analysis"
}

Respond with ONLY the JSON object:`;

    try {
      console.log('📡 Sending request to Gemini 2.0 Flash...');
      // Use the official SDK format
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      console.log('📥 Gemini response received!');
      const responseText = response.text || '';
      console.log('📝 Raw Gemini response:', responseText.substring(0, 200) + '...');
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      console.log('🔍 Extracting JSON from response...');
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parsed successfully:', parsed);
      
      // Validate required fields
      const required = ['title', 'category', 'urgency'];
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      console.log('🎉 GEMINI PARSING COMPLETE - SUCCESS!');
      return {
        ...parsed,
        aiProcessed: true,
        source: 'gemini-2.0-flash',
        confidence: 0.9
      };

    } catch (error) {
      console.error('💥 Gemini SDK error:', error.message);
      throw error;
    }
  }

  // Enhanced streaming response for real-time feedback
  async* parseNaturalLanguageTaskStreaming(text) {
    if (!this.geminiClient) {
      yield { error: 'Gemini client not available' };
      return;
    }

    const prompt = `Parse this task step by step: "${text}"
    
    Think through:
    1. What is the main action?
    2. What category does this belong to?
    3. How urgent is this based on language used?
    4. When should this be done?
    
    Then provide the final JSON structure.`;

    try {
      const response = this.geminiClient.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      let fullResponse = '';
      
      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        fullResponse += chunkText;
        
        yield {
          type: 'chunk',
          text: chunkText,
          fullText: fullResponse
        };
      }

      // Try to parse final JSON
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          yield {
            type: 'complete',
            result: {
              ...parsed,
              aiProcessed: true,
              source: 'gemini-2.0-flash-stream',
              confidence: 0.9
            }
          };
        } catch (parseError) {
          yield { type: 'error', error: 'Failed to parse final JSON' };
        }
      } else {
        yield { type: 'error', error: 'No valid JSON found in response' };
      }

    } catch (error) {
      yield { type: 'error', error: error.message };
    }
  }

  // Enhanced Hugging Face categorization with retry logic
  async categorizeTaskWithHF(title, description = '') {
    if (!this.hfApiKey) {
      console.log('⚠️ No Hugging Face API key, using simple categorization');
      return this.simpleCategorize(title, description);
    }

    const text = `${title} ${description}`.trim();
    const categories = [
      'work and professional tasks',
      'personal and family matters', 
      'health and medical',
      'finance and money',
      'education and learning',
      'shopping and errands',
      'travel and transportation',
      'entertainment and leisure',
      'household and maintenance',
      'emergency and urgent matters'
    ];

    try {
      const response = await this.callHuggingFaceWithRetry(
        this.models.categorization,
        {
          inputs: text,
          parameters: {
            candidate_labels: categories,
            multi_class: false
          }
        }
      );

      const categoryMap = {
        'work and professional tasks': 'work',
        'personal and family matters': 'personal',
        'health and medical': 'health',
        'finance and money': 'finance',
        'education and learning': 'education',
        'shopping and errands': 'shopping',
        'travel and transportation': 'travel',
        'entertainment and leisure': 'entertainment',
        'household and maintenance': 'household',
        'emergency and urgent matters': 'emergency'
      };

      const topLabel = response.labels[0];
      const confidence = response.scores[0];

      return {
        suggestedCategory: categoryMap[topLabel] || 'general',
        categoryConfidence: confidence,
        allPredictions: response.labels.slice(0, 3).map((label, idx) => ({
          category: categoryMap[label] || label,
          confidence: response.scores[idx]
        }))
      };

    } catch (error) {
      console.error('HF categorization error:', error.message);
      return this.simpleCategorize(title, description);
    }
  }

  // Enhanced sentiment-based priority detection
  async detectPriorityWithSentiment(title, description = '') {
    if (!this.hfApiKey) {
      return this.simplePriorityDetection(title, description);
    }

    const text = `${title} ${description}`.trim();

    try {
      const response = await this.callHuggingFaceWithRetry(
        this.models.sentiment,
        { inputs: text }
      );

      // Analyze sentiment and urgency keywords
      const urgencyKeywords = {
        high: ['urgent', 'asap', 'emergency', 'critical', 'immediate', 'rush', 'deadline', 'important'],
        medium: ['soon', 'today', 'tomorrow', 'this week', 'needed', 'please'],
        low: ['sometime', 'eventually', 'when possible', 'low priority', 'nice to have']
      };

      let keywordPriority = 'medium';
      const lowerText = text.toLowerCase();

      for (const [priority, keywords] of Object.entries(urgencyKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
          keywordPriority = priority;
          break;
        }
      }

      // Combine sentiment with keyword analysis
      const sentimentScore = response[0]?.score || 0.5;
      const sentimentLabel = response[0]?.label?.toLowerCase() || 'neutral';

      let finalPriority = keywordPriority;
      let confidence = 0.6;

      // Adjust based on sentiment
      if (sentimentLabel === 'negative' && sentimentScore > 0.7) {
        finalPriority = keywordPriority === 'low' ? 'medium' : 'high';
        confidence += 0.2;
      }

      return {
        suggestedPriority: finalPriority,
        priorityConfidence: confidence,
        sentimentAnalysis: {
          label: sentimentLabel,
          score: sentimentScore
        },
        keywordAnalysis: {
          detectedPriority: keywordPriority,
          matchedKeywords: urgencyKeywords[keywordPriority].filter(k => lowerText.includes(k))
        }
      };

    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      return this.simplePriorityDetection(title, description);
    }
  }

  // Enhanced task enhancement using only Gemini (no Hugging Face)
  async enhanceTask(title, description, dueDate) {
    console.log(`🔧 Enhancing task: "${title}"`);

    try {
      // Skip Hugging Face calls if no valid token available
      if (!this.hfApiKey || this.hfApiKey === 'your_huggingface_token_here') {
        console.log('⚠️ Skipping Hugging Face enhancement - no valid API key available');
        
        // Use Gemini for time estimation only
        let timeEstimation = null;
        if (this.geminiClient) {
          try {
            timeEstimation = await this.estimateTaskTime(title, description);
          } catch (error) {
            console.warn('Time estimation failed:', error.message);
          }
        }

        return {
          suggestedCategory: 'general',
          suggestedPriority: 'medium', 
          ...timeEstimation,
          enhanced: true,
          timestamp: new Date().toISOString(),
          source: 'gemini-only'
        };
      }

      // Run categorization and priority detection in parallel
      const [categoryResult, priorityResult] = await Promise.all([
        this.categorizeTaskWithHF(title, description),
        this.detectPriorityWithSentiment(title, description)
      ]);

      // Get time estimation from Gemini if available
      let timeEstimation = null;
      if (this.geminiClient) {
        try {
          timeEstimation = await this.estimateTaskTime(title, description);
        } catch (error) {
          console.warn('Time estimation failed:', error.message);
        }
      }

      return {
        ...categoryResult,
        ...priorityResult,
        ...timeEstimation,
        enhanced: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Task enhancement error:', error.message);
      return {
        suggestedCategory: 'general',
        suggestedPriority: 'medium',
        enhanced: false,
        error: error.message
      };
    }
  }

  // Time estimation using Gemini
  async estimateTaskTime(title, description) {
    if (!this.geminiClient) return null;

    const prompt = `
Estimate how long this task would typically take to complete:
Title: "${title}"
Description: "${description}"

Consider the complexity and typical time requirements. Return only a JSON object:
{
  "estimatedCompletionTime": number (in minutes),
  "reasoning": "Brief explanation of time estimate"
}`;

    try {
      const result = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      const responseText = result.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

    } catch (error) {
      console.error('Time estimation error:', error.message);
    }

    return null;
  }

  // Enhanced batch analysis with better insights
  async analyzeBatchTasks(tasks) {
    console.log(`📊 Analyzing ${tasks.length} tasks for insights`);

    try {
      const analysis = {
        totalTasks: tasks.length,
        categoryDistribution: {},
        priorityDistribution: {},
        timeEstimates: {
          total: 0,
          average: 0
        },
        insights: [],
        recommendations: []
      };

      // Analyze distributions
      tasks.forEach(task => {
        const category = task.category || 'general';
        const priority = task.priority || 'medium';

        analysis.categoryDistribution[category] = (analysis.categoryDistribution[category] || 0) + 1;
        analysis.priorityDistribution[priority] = (analysis.priorityDistribution[priority] || 0) + 1;

        if (task.estimatedTime) {
          analysis.timeEstimates.total += task.estimatedTime;
        }
      });

      analysis.timeEstimates.average = analysis.timeEstimates.total / tasks.length;

      // Generate insights using Gemini if available
      if (this.geminiClient && tasks.length > 0) {
        try {
          const insights = await this.generateTaskInsights(analysis, tasks);
          analysis.insights = insights.insights || [];
          analysis.recommendations = insights.recommendations || [];
        } catch (error) {
          console.warn('Insight generation failed:', error.message);
        }
      }

      // Add simple insights as fallback
      if (analysis.insights.length === 0) {
        analysis.insights = this.generateSimpleInsights(analysis);
      }

      return analysis;

    } catch (error) {
      console.error('Batch analysis error:', error.message);
      return {
        error: error.message,
        totalTasks: tasks.length
      };
    }
  }

  // Generate insights using Gemini
  async generateTaskInsights(analysis, tasks) {
    const prompt = `
Analyze this task data and provide insights:

Total tasks: ${analysis.totalTasks}
Categories: ${JSON.stringify(analysis.categoryDistribution)}
Priorities: ${JSON.stringify(analysis.priorityDistribution)}
Average time estimate: ${analysis.timeEstimates.average} minutes

Sample tasks:
${tasks.slice(0, 5).map(t => `- ${t.title} (${t.category}, ${t.priority})`).join('\n')}

Provide insights and recommendations in this JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    try {
      const result = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      const responseText = result.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

    } catch (error) {
      console.error('Insight generation error:', error.message);
    }

    return { insights: [], recommendations: [] };
  }

  // Utility methods
  async callHuggingFaceWithRetry(model, payload, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.hfBaseUrl}/${model}`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.hfApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        return response.data;

      } catch (error) {
        console.warn(`HF API attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  createFallbackTask(text) {
    return {
      title: text.length > 50 ? text.substring(0, 50) + '...' : text,
      description: text.length > 50 ? text : '',
      category: 'general',
      urgency: 'medium',
      type: 'task',
      estimatedDuration: 30,
      aiProcessed: false,
      source: 'simple-fallback',
      confidence: 0.3
    };
  }

  simpleCategorize(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categoryKeywords = {
      work: ['work', 'job', 'office', 'meeting', 'project', 'deadline', 'client', 'business'],
      health: ['doctor', 'hospital', 'medicine', 'health', 'appointment', 'dentist', 'therapy'],
      finance: ['bank', 'money', 'payment', 'bill', 'budget', 'insurance', 'tax'],
      shopping: ['buy', 'shop', 'store', 'purchase', 'grocery', 'market'],
      personal: ['family', 'friend', 'personal', 'home', 'call', 'visit']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return { suggestedCategory: category, categoryConfidence: 0.5 };
      }
    }

    return { suggestedCategory: 'general', categoryConfidence: 0.3 };
  }

  simplePriorityDetection(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (['urgent', 'asap', 'emergency', 'critical', 'immediately'].some(word => text.includes(word))) {
      return { suggestedPriority: 'high', priorityConfidence: 0.8 };
    }
    
    if (['soon', 'today', 'tomorrow', 'important'].some(word => text.includes(word))) {
      return { suggestedPriority: 'medium', priorityConfidence: 0.6 };
    }
    
    return { suggestedPriority: 'low', priorityConfidence: 0.4 };
  }

  generateSimpleInsights(analysis) {
    const insights = [];
    
    const topCategory = Object.entries(analysis.categoryDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      insights.push(`Most tasks are in ${topCategory[0]} category (${topCategory[1]} tasks)`);
    }

    const highPriorityCount = analysis.priorityDistribution.high || 0;
    if (highPriorityCount > analysis.totalTasks * 0.3) {
      insights.push(`High number of high-priority tasks (${highPriorityCount}) - consider delegation`);
    }

    if (analysis.timeEstimates.average > 60) {
      insights.push(`Tasks average ${Math.round(analysis.timeEstimates.average)} minutes - consider breaking down larger tasks`);
    }

    return insights;
  }
}

module.exports = new ImprovedAIService();
