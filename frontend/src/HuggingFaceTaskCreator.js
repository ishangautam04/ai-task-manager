import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Clock, Target, Lightbulb, Zap, BarChart3, AlertCircle } from 'lucide-react';

const HuggingFaceTaskCreator = ({ onTaskCreate, tasks = [] }) => {
  const [nlInput, setNlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [batchAnalysis, setBatchAnalysis] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Load smart suggestions when component mounts
    loadSmartSuggestions();
  }, [tasks]);

  const loadSmartSuggestions = async () => {
    try {
      const response = await fetch('/api/ai/suggestions', {
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

  const handleNaturalLanguageInput = async () => {
    if (!nlInput.trim()) return;
    
    setIsProcessing(true);
    try {
      // Parse natural language with Gemini
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: nlInput })
      });

      if (response.ok) {
        const parsedTask = await response.json();
        
        // Get Hugging Face enhancements
        const enhanceResponse = await fetch('/api/ai/enhance-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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
            originalText: nlInput
          });
        } else {
          setAiSuggestions(parsedTask);
        }
      }
    } catch (error) {
      console.error('Error processing natural language:', error);
      // Create fallback task
      setAiSuggestions({
        title: nlInput.length > 50 ? nlInput.substring(0, 50) + '...' : nlInput,
        description: nlInput.length > 50 ? nlInput : '',
        suggestedCategory: 'general',
        suggestedPriority: 'medium',
        estimatedCompletionTime: 30,
        aiProcessed: false,
        source: 'fallback'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAnalysis = async () => {
    if (!tasks || tasks.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const incompleteTasks = tasks.filter(task => task.status !== 'completed').slice(0, 10);
      
      const response = await fetch('/api/ai/analyze-batch', {
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

  const handleCreateTask = () => {
    if (aiSuggestions) {
      const taskData = {
        title: aiSuggestions.title,
        description: aiSuggestions.description || '',
        priority: aiSuggestions.suggestedPriority || aiSuggestions.priority || 'medium',
        category: aiSuggestions.suggestedCategory || aiSuggestions.category || 'general',
        type: aiSuggestions.type || 'task',
        dueDate: aiSuggestions.dueDate,
        estimatedTime: aiSuggestions.estimatedCompletionTime
      };
      
      onTaskCreate(taskData);
      setNlInput('');
      setAiSuggestions(null);
    }
  };

  const ConfidenceBar = ({ confidence, label }) => (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-600 w-16">{label}:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            confidence > 0.8 ? 'bg-green-500' : 
            confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">{Math.round(confidence * 100)}%</span>
    </div>
  );

  const SuggestionCard = ({ suggestion }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {suggestion.type === 'urgent_task' && <AlertCircle className="h-5 w-5 text-red-500" />}
          {suggestion.type === 'pattern_suggestion' && <BarChart3 className="h-5 w-5 text-blue-500" />}
          {suggestion.type === 'overdue_analysis' && <Clock className="h-5 w-5 text-orange-500" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{suggestion.message}</p>
          {suggestion.confidence && (
            <div className="mt-2">
              <ConfidenceBar confidence={suggestion.confidence} label="AI Confidence" />
            </div>
          )}
          {suggestion.recommendation && (
            <p className="text-xs text-gray-600 mt-1">{suggestion.recommendation}</p>
          )}
        </div>
      </div>
    </div>
  );

  const BatchAnalysisCard = ({ item }) => (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-purple-900 truncate flex-1">{item.title}</h4>
        <div className="text-xs text-purple-600">
          {item.error ? 'Analysis Failed' : 'Analyzed'}
        </div>
      </div>
      
      {!item.error && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Category: </span>
              <span className={`font-medium ${
                item.recommendations?.shouldUpdateCategory ? 'text-orange-600' : 'text-green-600'
              }`}>
                {item.suggestedCategory}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Priority: </span>
              <span className={`font-medium ${
                item.recommendations?.shouldUpdatePriority ? 'text-orange-600' : 'text-green-600'
              }`}>
                {item.suggestedPriority}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <ConfidenceBar confidence={item.categoryConfidence} label="Category" />
            <ConfidenceBar confidence={item.priorityConfidence} label="Priority" />
          </div>
          
          {(item.recommendations?.shouldUpdateCategory || item.recommendations?.shouldUpdatePriority) && (
            <div className="bg-orange-100 text-orange-800 text-xs p-2 rounded">
              AI suggests updating this task based on content analysis
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* AI Task Creator with Hugging Face */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Brain className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI Task Creator</h3>
          <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
            Hugging Face + Gemini
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your task naturally
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g., 'Call dentist urgently tomorrow about pain' or 'Research vacation destinations when I have time'"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageInput()}
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
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    (aiSuggestions.suggestedPriority || aiSuggestions.priority) === 'high' ? 'bg-red-100 text-red-800' :
                    (aiSuggestions.suggestedPriority || aiSuggestions.priority) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {aiSuggestions.suggestedPriority || aiSuggestions.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-gray-900">{aiSuggestions.estimatedCompletionTime || 30} min</span>
                  </div>
                </div>
              </div>

              {/* Confidence Scores */}
              {aiSuggestions.categoryConfidence && (
                <div className="mb-4 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">AI Confidence Scores</h5>
                  <ConfidenceBar confidence={aiSuggestions.categoryConfidence} label="Category" />
                  {aiSuggestions.priorityConfidence && (
                    <ConfidenceBar confidence={aiSuggestions.priorityConfidence} label="Priority" />
                  )}
                </div>
              )}

              {/* Alternative Suggestions */}
              {aiSuggestions.alternativeCategories && aiSuggestions.alternativeCategories.length > 1 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Alternative Categories</h5>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.alternativeCategories.slice(1, 4).map((alt, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {alt.category} ({Math.round(alt.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
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

      {/* Batch Analysis Feature */}
      {tasks && tasks.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Batch AI Analysis</h3>
            </div>
            <button
              onClick={handleBatchAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {isAnalyzing ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Analyze Tasks
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Analyze up to 10 of your incomplete tasks using Hugging Face AI models for improved categorization and priority detection.
          </p>

          {batchAnalysis && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Analyzed {batchAnalysis.processedCount} tasks</span>
                <span>{batchAnalysis.timestamp ? new Date(batchAnalysis.timestamp).toLocaleTimeString() : ''}</span>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {batchAnalysis.analysis?.map((item, index) => (
                  <BatchAnalysisCard key={index} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
          </div>
          
          <div className="space-y-3">
            {smartSuggestions.map((suggestion, index) => (
              <SuggestionCard key={index} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HuggingFaceTaskCreator;
