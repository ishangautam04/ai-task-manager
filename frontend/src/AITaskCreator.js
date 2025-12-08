import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Clock, Target, Lightbulb } from 'lucide-react';
import ProductivityML from './ProductivityML';

const AITaskCreator = ({ onTaskCreate, tasks = [] }) => {
  const [nlInput, setNlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [productivityML] = useState(new ProductivityML());
  const [insights, setInsights] = useState(null);
  const [optimalTimes, setOptimalTimes] = useState([]);

  useEffect(() => {
    // Initialize ML model
    productivityML.initializeModel();
    
    // Analyze user patterns
    if (tasks.length > 0) {
      const patterns = productivityML.analyzeProductivityPatterns(tasks);
      setInsights(patterns);
      
      // Get optimal times for current tasks
      productivityML.predictOptimalTime(tasks.filter(t => t.status !== 'completed'))
        .then(setOptimalTimes);
    }
  }, [tasks, productivityML]);

  const handleNaturalLanguageInput = async () => {
    if (!nlInput.trim()) return;
    
    setIsProcessing(true);
    try {
      // Parse natural language with AI
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
        
        // Get AI enhancements
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
      // Fallback to basic parsing
      setAiSuggestions({
        title: nlInput.length > 50 ? nlInput.substring(0, 50) + '...' : nlInput,
        description: nlInput.length > 50 ? nlInput : '',
        suggestedCategory: 'general',
        suggestedPriority: 'medium',
        estimatedCompletionTime: 30
      });
    } finally {
      setIsProcessing(false);
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

  const OptimalTimeCard = ({ prediction }) => (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-purple-900 truncate">{prediction.title}</h4>
          <p className="text-sm text-purple-600">{prediction.suggestedTime}</p>
        </div>
        <div className="text-right">
          <div className={`text-xs px-2 py-1 rounded-full ${
            prediction.confidence === 'high' ? 'bg-green-100 text-green-800' :
            prediction.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {Math.round(prediction.productivityScore * 100)}% match
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* AI Task Creator */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Brain className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI Task Creator</h3>
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
                placeholder="e.g., 'Call dentist tomorrow at 2pm about cleaning appointment'"
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
                <h4 className="font-medium text-gray-900">AI Suggestions</h4>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  AI Enhanced
                </span>
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

      {/* Productivity Insights */}
      {insights && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Productivity Insights</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-gray-900 mb-2">Completion Rate</h4>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(insights.completionRate)}%
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Best Day</h4>
              <div className="text-lg font-semibold text-blue-600">
                {insights.insights?.bestDay || 'Monday'}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-gray-900 mb-2">Peak Hour</h4>
              <div className="text-lg font-semibold text-purple-600">
                {insights.insights?.bestHour || '9:00 AM'}
              </div>
            </div>
          </div>

          {insights.insights?.recommendations && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">AI Recommendations</h4>
              <ul className="space-y-1">
                {insights.insights.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Optimal Timing Suggestions */}
      {optimalTimes.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Optimal Timing</h3>
          </div>
          
          <div className="space-y-2">
            {optimalTimes.slice(0, 5).map((prediction, index) => (
              <OptimalTimeCard key={index} prediction={prediction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskCreator;
