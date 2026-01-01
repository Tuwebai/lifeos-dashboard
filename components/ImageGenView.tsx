
import React, { useState } from 'react';
import { Download, Sparkles, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { GeneratedAsset } from '../types';

const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedAsset[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGallery(prev => [{
          id: Date.now().toString(),
          type: 'image',
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now()
        }, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error('Image gen error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeImage = (id: string) => {
    setGallery(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full mb-8">
        <h2 className="text-2xl font-bold mb-2">Visual Playground</h2>
        <p className="text-gray-400 text-sm mb-6">Describe anything and watch Gemini 2.5 Flash Image bring it to life.</p>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cyber-city at twilight with neon rains and flying cars, high resolution cinematic style..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none h-32"
            />
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Aspect Ratio:</span>
                <div className="flex bg-gray-800 rounded-lg p-1">
                  {(['1:1', '4:3', '16:9'] as const).map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        aspectRatio === ratio ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20 group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Imagining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            Your Creations
          </h3>
          <span className="text-xs text-gray-500">{gallery.length} assets</span>
        </div>

        {gallery.length === 0 ? (
          <div className="border-2 border-dashed border-gray-800 rounded-3xl h-64 flex flex-col items-center justify-center text-gray-500">
            <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No images generated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((asset) => (
              <div key={asset.id} className="group relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:ring-2 hover:ring-purple-500/50 transition-all shadow-xl">
                <img src={asset.url} alt={asset.prompt} className="w-full h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-xs text-gray-200 line-clamp-2 mb-3 bg-black/40 backdrop-blur-sm p-2 rounded-lg">{asset.prompt}</p>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = asset.url;
                        link.download = `gemini-gen-${asset.id}.png`;
                        link.click();
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                    <button 
                      onClick={() => removeImage(asset.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg backdrop-blur-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenView;
