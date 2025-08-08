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
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setError(null);
      setIsRecording(true);
    };

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`);
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
        
        const updateAudioLevel = () => {
          if (!isRecording) return;
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume - Commented out for now as it's not being used in UI
          // const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          // setAudioLevel(average);
          
          visualizationAnimationFrame = requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
      })
      .catch(err => {
        setError('Please allow microphone access to use this feature.');
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
  }, [isRecording]); // Added isRecording to dependency array

  const startRecording = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Error starting recording. Please try again.');
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
