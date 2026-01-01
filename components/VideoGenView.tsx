
import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const VideoGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Required: Check for selected API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for local development or if not in expected environment
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume selection successful and proceed as per instructions
      setHasKey(true);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatusMessage('Initializing video engine...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setStatusMessage('Directing frames... this usually takes a few minutes.');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setStatusMessage(prev => {
          const messages = [
            'Directing frames... almost there.',
            'Refining motion and lighting...',
            'Adding cinematic textures...',
            'Finalizing your masterpiece...'
          ];
          return messages[Math.floor(Math.random() * messages.length)];
        });
        
        try {
          operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (opError: any) {
          if (opError.message?.includes("Requested entity was not found")) {
            setHasKey(false);
            throw new Error("API Key session expired. Please re-select your project.");
          }
          throw opError;
        }
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (error: any) {
      console.error('Video generation error:', error);
      alert(error.message || 'Video generation failed. Ensure your selected project has billing enabled.');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  if (hasKey === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-4">API Key Required for Veo</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Video generation using Veo 3.1 requires a specific API key from a Google Cloud project with billing enabled.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button 
            onClick={handleSelectKey}
            className="w-full py-4 px-6 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Select Billing-Enabled Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Learn about Gemini API billing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full h-full flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
            <Video className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Veo Studio</h2>
        </div>
        <p className="text-gray-400">High-fidelity cinematic video generation at your fingertips.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 flex-1">
        <div className="flex flex-col gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 flex flex-col gap-4 h-fit">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visual Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A golden retriever astronaut floating weightlessly inside a futuristic space station, cinematic lighting, 4k..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 min-h-[160px] resize-none"
            />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-gray-400 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <Clock className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Video generation typically takes 2-4 minutes to process.</span>
              </div>
              
              <button
                onClick={generateVideo}
                disabled={!prompt.trim() || isGenerating}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-pink-900/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Movie...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-900/30 border border-gray-800 border-dashed rounded-3xl animate-pulse">
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-pink-400 mb-1">{statusMessage}</p>
              <p className="text-sm text-gray-500">Please do not refresh this page.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col h-full">
          <div className="bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-[400px]">
            {videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-gray-900/20">
                <Play className="w-16 h-16 opacity-20 mb-4" />
                <p className="text-sm font-medium">Your generated video will appear here</p>
              </div>
            )}
            
            {videoUrl && (
              <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Generated with Veo 3.1</span>
                <a 
                  href={videoUrl} 
                  download="gemini-video.mp4"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                >
                  Download MP4
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenView;
