import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Clock, Target, Bot } from 'lucide-react';

// API configuration
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ImprovedAITaskCreator = ({ onTaskCreate, tasks = [] }) => {
  const [nlInput, setNlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [geminiClient, setGeminiClient] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize Gemini client when component mounts
  useEffect(() => {
    // Note: For security, we don't use Gemini API key in frontend
    // All AI processing happens through our backend
    console.log('✅ AI Task Creator initialized - using backend AI services');
  }, []);

  // Load smart suggestions from backend
  useEffect(() => {
    // loadSmartSuggestions(); // Temporarily disabled
  }, [tasks]);

  /* Temporarily disabled to avoid warnings
  const loadSmartSuggestions = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai/suggestions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSmartSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };
  */

  // Enhanced natural language processing with new Gemini SDK
  const processWithGemini = async (text) => {
    if (!geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const prompt = `
Parse this natural language text into a structured task. Analyze the content and extract:
1. Title (concise main action)
2. Description (additional details if any)
3. Due date (if mentioned, format as ISO string, otherwise null)
4. Type (task/event/reminder)
5. Estimated duration in minutes
6. Urgency level (low/medium/high based on language used)
7. Category suggestion (work/personal/health/finance/education/shopping/travel/entertainment/household)

Text to parse: "${text}"

Return ONLY a valid JSON object with these exact fields: title, description, dueDate, type, estimatedDuration, urgency, category, reasoning.
Include a "reasoning" field explaining your analysis.

JSON:`;

    try {
      // Use the new streaming API for better responsiveness
      const response = await geminiClient.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      let fullResponse = '';
      setIsStreaming(true);
      setStreamingText('');

      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        fullResponse += chunkText;
        setStreamingText(fullResponse);
      }

      setIsStreaming(false);

      // Extract JSON from response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          aiProcessed: true,
          source: 'gemini-2.0-flash',
          confidence: 0.9
        };
      }

      throw new Error('No valid JSON found in response');

    } catch (error) {
      console.error('Gemini processing error:', error);
      throw error;
    }
  };

  // Enhanced natural language input processing (backend only)
  const handleNaturalLanguageInput = async () => {
    if (!nlInput.trim()) return;
    
    setIsProcessing(true);
    setStreamingText('');
    
    try {
      // Use backend processing (which includes Gemini + Hugging Face)
      const parsedTask = await processWithBackend(nlInput);

      // Get additional AI enhancements from backend
      const enhanceResponse = await fetch(`${API_BASE}/ai/enhance-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: parsedTask.title,
          description: parsedTask.description,
          dueDate: parsedTask.dueDate
        })
      });

      if (enhanceResponse.ok) {
        const enhancements = await enhanceResponse.json();
        
        setAiSuggestions({
          ...parsedTask,
          ...enhancements,
          originalText: nlInput,
          aiEnhanced: true
        });
      } else {
        setAiSuggestions({
          ...parsedTask,
          originalText: nlInput
        });
      }

    } catch (error) {
      console.error('Error processing natural language:', error);
      
      // Ultimate fallback - simple parsing
      setAiSuggestions(createFallbackTask(nlInput));
    } finally {
      setIsProcessing(false);
    }
  };

  // Backend processing (Gemini + Hugging Face on server)
  const processWithBackend = async (text) => {
    const response = await fetch(`${API_BASE}/ai/parse-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Backend processing failed');
    }

    return await response.json();
  };

  // Simple fallback for when all AI fails
  const createFallbackTask = (text) => {
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
  };

  /* Temporarily disabled to avoid warnings
  // Enhanced batch analysis
  const handleBatchAnalysis = async () => {
    if (!tasks || tasks.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const incompleteTasks = tasks.filter(task => task.status !== 'completed').slice(0, 10);
      
      const response = await fetch(`${API_BASE}/ai/analyze-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tasks: incompleteTasks })
      });

      if (response.ok) {
        const analysis = await response.json();
        setBatchAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error in batch analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  */

  const handleCreateTask = () => {
    if (aiSuggestions) {
      const taskData = {
        title: aiSuggestions.title,
        description: aiSuggestions.description || '',
        priority: aiSuggestions.suggestedPriority || aiSuggestions.urgency || aiSuggestions.priority || 'medium',
        category: aiSuggestions.suggestedCategory || aiSuggestions.category || 'general',
        type: aiSuggestions.type || 'task',
        dueDate: aiSuggestions.dueDate,
        estimatedTime: aiSuggestions.estimatedCompletionTime || aiSuggestions.estimatedDuration
      };
      
      onTaskCreate(taskData);
      setNlInput('');
      setAiSuggestions(null);
      setStreamingText('');
    }
  };

  const ConfidenceBar = ({ confidence, label }) => (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-600 w-16">{label}:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            confidence > 0.8 ? 'bg-green-500' : 
            confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">{Math.round(confidence * 100)}%</span>
    </div>
  );

  const AIStatusIndicator = () => (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${geminiClient ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className="text-gray-600">
        {geminiClient ? 'Gemini 2.0 Ready' : 'Fallback Mode'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced AI Task Creator */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bot className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">AI Task Creator</h3>
            <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              Gemini 2.0 + Hugging Face
            </span>
          </div>
          <AIStatusIndicator />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your task naturally (with AI streaming response)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g., 'Emergency dentist appointment ASAP for severe pain' or 'Plan vacation next month'"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageInput()}
                disabled={isProcessing}
              />
              <button
                onClick={handleNaturalLanguageInput}
                disabled={isProcessing || !nlInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {isProcessing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Streaming Response Preview */}
          {isStreaming && streamingText && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full mr-2" />
                <span className="text-sm font-medium text-blue-900">AI is thinking...</span>
              </div>
              <div className="text-xs text-gray-700 font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                {streamingText}
              </div>
            </div>
          )}

          {aiSuggestions && (
            <div className="bg-white rounded-lg border border-purple-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">AI Analysis Results</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    aiSuggestions.aiProcessed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {aiSuggestions.aiProcessed ? 'AI Enhanced' : 'Fallback'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {aiSuggestions.source}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{aiSuggestions.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900 capitalize">{aiSuggestions.suggestedCategory || aiSuggestions.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority/Urgency</label>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    (aiSuggestions.suggestedPriority || aiSuggestions.urgency || aiSuggestions.priority) === 'high' ? 'bg-red-100 text-red-800' :
                    (aiSuggestions.suggestedPriority || aiSuggestions.urgency || aiSuggestions.priority) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {aiSuggestions.suggestedPriority || aiSuggestions.urgency || aiSuggestions.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-gray-900">
                      {aiSuggestions.estimatedCompletionTime || aiSuggestions.estimatedDuration || 30} min
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Reasoning (if available from Gemini) */}
              {aiSuggestions.reasoning && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 mb-1">AI Reasoning:</h5>
                  <p className="text-sm text-blue-800">{aiSuggestions.reasoning}</p>
                </div>
              )}

              {/* Confidence Scores */}
              {(aiSuggestions.categoryConfidence || aiSuggestions.confidence) && (
                <div className="mb-4 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">AI Confidence Scores</h5>
                  {aiSuggestions.categoryConfidence && (
                    <ConfidenceBar confidence={aiSuggestions.categoryConfidence} label="Category" />
                  )}
                  {aiSuggestions.priorityConfidence && (
                    <ConfidenceBar confidence={aiSuggestions.priorityConfidence} label="Priority" />
                  )}
                  {aiSuggestions.confidence && (
                    <ConfidenceBar confidence={aiSuggestions.confidence} label="Overall" />
                  )}
                </div>
              )}
              
              {aiSuggestions.description && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-700">{aiSuggestions.description}</p>
                </div>
              )}

              <button
                onClick={handleCreateTask}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center"
              >
                <Target className="h-4 w-4 mr-2" />
                Create AI-Enhanced Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rest of the component remains the same - Batch Analysis, Smart Suggestions, etc. */}
      {/* ... (keeping existing code for batch analysis and suggestions) ... */}
    </div>
  );
};

export default ImprovedAITaskCreator;
