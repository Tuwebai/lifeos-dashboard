
import React, { useState } from 'react';
import { geminiService } from '../services/gemini';

const VisionLab: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('Describe this image in detail and identify key elements.');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    try {
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      
      const result = await geminiService.analyzeImage(
        { inlineData: { data: base64Data, mimeType } },
        prompt
      );
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis('Error analyzing image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Vision Lab</h2>
          <p className="text-slate-400">Upload any image and let Gemini's vision models analyze it for you.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload & Preview */}
          <div className="space-y-4">
            <div 
              className={`relative border-2 border-dashed rounded-3xl transition-all h-[400px] overflow-hidden flex flex-col items-center justify-center ${
                selectedImage ? 'border-blue-500' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full hover:bg-red-500 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center p-12 text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <i className="fas fa-cloud-arrow-up text-2xl text-blue-500"></i>
                  </div>
                  <span className="text-lg font-medium text-slate-300">Click to upload image</span>
                  <span className="text-sm text-slate-500 mt-1">Supports JPG, PNG, WEBP</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Analysis Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                rows={3}
              />
              <button
                onClick={analyzeImage}
                disabled={!selectedImage || isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30"
              >
                {isLoading ? (
                  <><i className="fas fa-circle-notch fa-spin mr-2"></i> Analyzing...</>
                ) : (
                  <><i className="fas fa-microscope mr-2"></i> Run Analysis</>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <i className="fas fa-comment-dots"></i>
              </div>
              <h3 className="font-bold">Insight Output</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-hide text-