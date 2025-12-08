import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  FileText,
  Calendar,
  Tag,
  Brain,
  Mic,
  Eye,
  EyeOff
} from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

const NotesManager = ({ token }) => {
  const [notes, setNotes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: []
  });

  const categories = [
    'all', 'work', 'personal', 'education', 'health', 'finance', 
    'travel', 'ideas', 'meetings', 'projects', 'research'
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (noteData = newNote) => {
    try {
      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNotes([createdNote, ...notes]);
        setNewNote({ title: '', content: '', category: 'general', tags: [] });
        setIsCreating(false);
        return createdNote;
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(notes.map(note => note._id === id ? updatedNote : note));
        setEditingNote(null);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotes(notes.filter(note => note._id !== id));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const analyzeNote = async (noteId, title, content) => {
    try {
      const response = await fetch('http://localhost:5000/api/ai/analyze-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, noteId })
      });

      if (response.ok) {
        const analysis = await response.json();
        // Update the note with AI analysis
        setNotes(notes.map(note => 
          note._id === noteId 
            ? { ...note, aiAnalysis: analysis }
            : note
        ));
        return analysis;
      }
    } catch (error) {
      console.error('Error analyzing note:', error);
    }
  };

  const handleVoiceTranscription = async (voiceData) => {
    const noteData = {
      title: voiceData.title,
      content: voiceData.content,
      category: 'voice-note',
      tags: voiceData.detectedTopics || [],
      metadata: {
        voiceNote: true,
        originalTranscription: voiceData.transcription,
        confidence: voiceData.confidence,
        wordCount: voiceData.wordCount,
        improvements: voiceData.improvements
      }
    };

    const createdNote = await createNote(noteData);
    if (createdNote) {
      setShowVoiceRecorder(false);
      // Auto-analyze the voice note
      await analyzeNote(createdNote._id, createdNote.title, createdNote.content);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleAIInsights = (noteId) => {
    setShowAIInsights(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          Notes Manager
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showVoiceRecorder 
                ? 'bg-red-500 text-white' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            <Mic className="h-4 w-4" />
            {showVoiceRecorder ? 'Hide Recorder' : 'Voice Note'}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      </div>

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder 
          onTranscriptionComplete={handleVoiceTranscription}
          onTextEnhanced={(enhanced, original) => {
            console.log('Text enhanced:', { enhanced, original });
          }}
        />
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
            />
            <textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center">
              <select
                value={newNote.category}
                onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => createNote()}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notes found. Create your first note!</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note._id} className="bg-white rounded-lg shadow-lg border overflow-hidden">
              {editingNote === note._id ? (
                // Edit Mode
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => setNotes(notes.map(n => 
                      n._id === note._id ? {...n, title: e.target.value} : n
                    ))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                  />
                  <textarea
                    value={note.content}
                    onChange={(e) => setNotes(notes.map(n => 
                      n._id === note._id ? {...n, content: e.target.value} : n
                    ))}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNote(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => updateNote(note._id, {title: note.title, content: note.content})}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{note.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(note.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            {note.category}
                          </span>
                          {note.metadata?.voiceNote && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              Voice Note
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => analyzeNote(note._id, note.title, note.content)}
                          className="text-purple-600 hover:text-purple-800 transition-colors"
                          title="Analyze with AI"
                        >
                          <Brain className="h-4 w-4" />
                        </button>
                        {note.aiAnalysis && (
                          <button
                            onClick={() => toggleAIInsights(note._id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Toggle AI Insights"
                          >
                            {showAIInsights[note._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingNote(note._id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteNote(note._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Insights Panel */}
                  {note.aiAnalysis && showAIInsights[note._id] && (
                    <div className="border-t bg-gradient-to-r from-purple-50 to-blue-50 p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        AI Insights
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Summary:</strong>
                          <p className="text-gray-700 mt-1">{note.aiAnalysis.summary}</p>
                        </div>
                        <div>
                          <strong>Sentiment:</strong>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            note.aiAnalysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            note.aiAnalysis.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {note.aiAnalysis.sentiment}
                          </span>
                        </div>
                        {note.aiAnalysis.keyPoints && (
                          <div className="md:col-span-2">
                            <strong>Key Points:</strong>
                            <ul className="list-disc list-inside mt-1 text-gray-700">
                              {note.aiAnalysis.keyPoints.map((point, index) => (
                                <li key={index}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesManager;
