import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Send,
  Volume2,
  Activity,
  Loader
} from 'lucide-react';

const VoiceRecorder = ({ onTranscriptionComplete, onTextEnhanced }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupportsSpeechRecognition(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscription(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsTranscribing(false);
      };

      recognitionRef.current.onend = () => {
        setIsTranscribing(false);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start audio recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start speech recognition if supported
      if (supportsSpeechRecognition && recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Stop speech recognition
      if (recognitionRef.current && isTranscribing) {
        recognitionRef.current.stop();
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setRecordingTime(0);
    setIsPlaying(false);
    chunksRef.current = [];
  };

  const enhanceTranscription = async () => {
    if (!transcription.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/voice/enhance-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcription }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTranscription(data.enhancedText);
        if (onTextEnhanced) {
          onTextEnhanced(data.enhancedText, data.originalText);
        }
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processVoiceNote = async () => {
    if (!transcription.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/voice/process-transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcription,
          language: 'en'
        }),
      });

      const data = await response.json();
      
      if (data.success && onTranscriptionComplete) {
        onTranscriptionComplete({
          title: data.suggestedTitle,
          content: data.cleanedText,
          transcription,
          wordCount: data.wordCount,
          detectedTopics: data.detectedTopics,
          confidence: data.confidence,
          improvements: data.improvements
        });
      }
    } catch (error) {
      console.error('Error processing voice note:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Mic className="h-5 w-5 text-blue-600" />
          Voice Recorder
        </h3>
        {!supportsSpeechRecognition && (
          <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Speech recognition not supported
          </span>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
            title="Start Recording"
          >
            <Mic className="h-6 w-6" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full transition-colors animate-pulse"
            title="Stop Recording"
          >
            <Square className="h-6 w-6" />
          </button>
        )}

        {audioUrl && (
          <>
            <button
              onClick={playAudio}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={resetRecording}
              className="bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-full transition-colors"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Recording Time */}
      {isRecording && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Transcription Status */}
      {isTranscribing && (
        <div className="text-center text-blue-600 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Listening...</span>
        </div>
      )}

      {/* Transcription Display */}
      {transcription && (
        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Transcription:</h4>
            <p className="text-gray-800 whitespace-pre-wrap">{transcription}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={enhanceTranscription}
              disabled={isProcessing}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessing ? <Loader className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              Enhance Text
            </button>
            <button
              onClick={processVoiceNote}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessing ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Create Note
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <h5 className="font-medium mb-1">How to use:</h5>
        <ul className="space-y-1 text-xs">
          <li>• Click the red microphone to start recording</li>
          <li>• Speak clearly and naturally</li>
          <li>• Click stop when finished</li>
          <li>• Use "Enhance Text" to improve formatting</li>
          <li>• Click "Create Note" to save as a note</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceRecorder;
