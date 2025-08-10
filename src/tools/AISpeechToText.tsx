import React, { useState, useEffect, useRef } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface TranscriptSegment {
  text: string;
  timestamp: number;
  confidence: number;
}

const AISpeechToText: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Check for secure context
    if (!window.isSecureContext) {
      setError('Speech recognition requires a secure connection. Please ensure you are using HTTPS.');
      return;
    }

    // Check for browser support
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    // Resume AudioContext if it's suspended (needed for some browsers)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Check for microphone permission
    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(permissionStatus => {
        if (permissionStatus.state === 'denied') {
          setError('Microphone access is blocked. Please allow microphone access in your browser settings.');
          return;
        }
        
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'denied') {
            setError('Microphone access was blocked. Please allow microphone access in your browser settings.');
            stopRecording();
          } else if (permissionStatus.state === 'granted') {
            setError(null);
          }
        };
      })
      .catch(err => {
        console.error('Error checking microphone permission:', err);
      });

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;
    
    // Update language when it changes
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
    
    // Force the AudioContext to resume on user interaction
    document.addEventListener('click', function resumeAudio() {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      document.removeEventListener('click', resumeAudio);
    });

    recognition.onstart = () => {
      setError(null);
      setIsRecording(true);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      switch (event.error) {
        case 'no-speech':
          setError('No speech was detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone was found or microphone is not working.');
          break;
        case 'not-allowed':
          setError('Microphone access was denied. Please allow microphone access in your browser settings.');
          break;
        case 'network':
          setError('Network error occurred. Please check your internet connection.');
          break;
        case 'aborted':
          // Don't show error for user-initiated stops
          setError(null);
          break;
        default:
          setError(`Error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          setTranscriptSegments(prev => [...prev, {
            text: transcript,
            timestamp: Date.now(),
            confidence: confidence
          }]);
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    // Initialize audio context for visualization
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    // Setup audio visualization
    let visualizationAnimationFrame: number;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        let isVisualizationActive = false;
        
        const updateAudioLevel = () => {
          if (!isRecording || !isVisualizationActive) return;
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          visualizationAnimationFrame = requestAnimationFrame(updateAudioLevel);
        };
        
        // Start or stop visualization based on isRecording
        if (isRecording && !isVisualizationActive) {
          isVisualizationActive = true;
          updateAudioLevel();
        }
      })
      .catch(err => {
        console.error('Microphone access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone access was denied. Please allow microphone access in your browser settings and reload the page.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No microphone found. Please connect a microphone and reload the page.');
        } else {
          setError('Error accessing microphone. Please check your microphone settings and reload the page.');
        }
      });

    return () => {
      recognition.stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (visualizationAnimationFrame) {
        cancelAnimationFrame(visualizationAnimationFrame);
      }
    };
  }, [selectedLanguage, isRecording]); // Add isRecording as it's used in updateAudioLevel

  const startRecording = async () => {
    if (!recognitionRef.current) return;
    
    try {
      // Make sure we're in a secure context
      if (!window.isSecureContext) {
        setError('Speech recognition requires a secure connection. Please ensure you are using HTTPS.');
        return;
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Check microphone permission status first
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'denied') {
        setError('Microphone access is blocked. Please allow microphone access in your browser settings and reload the page.');
        return;
      }

      // Request microphone access and wait for it to be ready
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Make sure recognition is initialized with correct language
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
        setError(null);
      } else {
        setError('Speech recognition failed to initialize. Please refresh the page.');
      }
    } catch (err: any) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone access in your browser settings and reload the page.');
      } else {
        setError('Error starting recording. Please check your microphone settings and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setError(null);
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Error stopping recording. Please try again.');
    }
  };

  const pauseRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsPaused(true);
      setError(null);
    } catch (err) {
      console.error('Error pausing recording:', err);
      setError('Error pausing recording. Please try again.');
    }
  };

  const resumeRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsPaused(false);
      setError(null);
    } catch (err) {
      console.error('Error resuming recording:', err);
      setError('Error resuming recording. Please try again.');
    }
  };

  const exportTranscript = () => {
    const content = JSON.stringify({
      transcript,
      segments: transcriptSegments,
      metadata: {
        language: selectedLanguage,
        timestamp: Date.now(),
        totalDuration: transcriptSegments.length > 0 
          ? transcriptSegments[transcriptSegments.length - 1].timestamp - transcriptSegments[0].timestamp 
          : 0
      }
    }, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearTranscript = () => {
    setTranscript('');
    setTranscriptSegments([]);
  };

  return (
    <ToolWrapper
      toolId="ai-speech-to-text"
      toolName="AI Speech to Text"
      toolDescription="Convert your speech into text with real-time transcription"
      toolCategory="Text Tools"
    >
      <div className="space-y-6 p-6">
       

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            className="w-full md:w-64 p-2 border rounded-lg"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="ta-IN">Tamil</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="it-IT">Italian</option>
            <option value="pt-PT">Portuguese</option>
            <option value="hi-IN">Hindi</option>
            <option value="ja-JP">Japanese</option>
            <option value="ko-KR">Korean</option>
            <option value="zh-CN">Chinese (Simplified)</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Transcript</h3>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={exportTranscript}
                  disabled={!transcript}
                >
                  Export
                </button>
                <button
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  onClick={clearTranscript}
                  disabled={!transcript}
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="relative">
              <textarea
                className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Start speaking to see the transcript here..."
                readOnly
              />
              {transcriptSegments.length > 0 && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  Confidence: {Math.round(transcriptSegments[transcriptSegments.length - 1].confidence * 100)}%
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  isRecording && !isPaused
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
                disabled={!!error}
              >
                {isRecording
                  ? (isPaused ? 'Resume Recording' : 'Pause Recording')
                  : 'Start Recording'}
              </button>
              {isRecording && (
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={stopRecording}
                >
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AISpeechToText;
