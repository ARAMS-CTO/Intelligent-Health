import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants/index';

// Check browser compatibility
// Fix: Cast window to any to access vendor-prefixed SpeechRecognition API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, onListeningChange, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Use refs to hold callbacks to avoid them being stale in recognition event handlers
  // and to avoid re-running the effect unnecessarily.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onListeningChangeRef = useRef(onListeningChange);
  onListeningChangeRef.current = onListeningChange;

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false; // Stop after a pause in speech for better UX
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript.trim() + ' ');
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      onListeningChangeRef.current?.(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      // onend will also be called, so state is handled there.
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChangeRef.current?.(false);
    };

    return () => {
      recognition.stop();
    };
  }, []); // Empty dependency array: runs only once on mount.

  const toggleListening = () => {
    if (disabled || !isSpeechRecognitionSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  if (!isSpeechRecognitionSupported) {
    return null; // Don't render if not supported
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 rounded-full transition-colors ${
        isListening 
          ? 'bg-danger text-white animate-pulse' 
          : 'text-text-muted hover:bg-slate-100'
      } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {ICONS.microphone}
    </button>
  );
};

export default VoiceInput;