

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { GeminiService } from '../services/api';
import { ICONS } from '../constants/index';
import VoiceInput from './VoiceInput';

interface ImageAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    data: await base64EncodedDataPromise,
    mimeType: file.type,
  };
};

// A simple and safe markdown to HTML renderer
const renderMarkdown = (text: string) => {
  const html = text
    .replace(/^### (.*$)/gim, '<h3 class="font-bold text-lg mb-2">$1</h3>') // H3
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>') // List items
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>'); // Bold

  // Wrap list items in a <ul> tag
  const listWrappedHtml = html.replace(/(<li.*<\/li>)+/gs, '<ul>$&</ul>');

  return { __html: listWrappedHtml };
};


const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ isOpen, onClose, isOffline }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult('');
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp', '.dcm'] },
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!imageFile || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult('');

    try {
      // Fix: Pass File object directly, let the service handle FormData
      const result = await GeminiService.analyzeImage(imageFile, "general", prompt);
      setAnalysisResult(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setImageFile(null);
    setPreviewUrl(null);
    setPrompt('');
    setAnalysisResult('');
    setError(null);
    setIsLoading(false);
    onClose();
  }

  if (!isOpen) return null;

  const placeholderText = isListening
    ? 'Listening...'
    : "e.g., 'Identify any anomalies in this CT scan.' or 'Describe the findings in this doppler ultrasound image.'";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            {ICONS.imageAnalysis} AI Image Analysis
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Upload and Preview */}
          <div className="flex flex-col gap-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
                }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center text-text-muted">
                {ICONS.upload}
                <p className="mt-2">
                  {isDragActive ? "Drop the image here" : "Drag 'n' drop an image here, or click to select"}
                </p>
                <p className="text-xs mt-1">PNG, JPG, GIF, WEBP, DCM supported</p>
              </div>
            </div>

            {previewUrl && (
              <div className="relative border rounded-lg overflow-hidden flex-1 min-h-[200px] bg-slate-100">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* Right side: Prompt and Results */}
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-text-muted mb-1">Your Analysis Prompt</label>
              <div className="relative">
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                  placeholder={placeholderText}
                  disabled={!imageFile}
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInput
                    onTranscript={(t) => setPrompt(p => p + t)}
                    onListeningChange={setIsListening}
                    disabled={!imageFile}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!imageFile || !prompt || isLoading || isOffline}
              className="w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-hover transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : 'Analyze Image'}
            </button>

            {(analysisResult || error || isLoading) && (
              <div className="flex-1 bg-slate-50 border rounded-lg p-4 overflow-y-auto">
                <h3 className="font-bold text-text-main mb-2">Analysis Result</h3>
                {isLoading && <p className="text-text-muted">The AI is analyzing the image. This might take a moment...</p>}
                {error && <p className="text-danger-text bg-danger-light p-2 rounded-md">{error}</p>}
                {analysisResult && (
                  <div className="prose prose-sm max-w-none text-text-main" dangerouslySetInnerHTML={renderMarkdown(analysisResult)} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysis;