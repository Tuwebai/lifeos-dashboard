
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Fix: text instead of content, new Date() for timestamp
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, userMsg].map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          // Fix: text instead of content
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are a world-class senior creative assistant. Your goal is to help users brainstorm ideas for images, videos, and complex projects. Be concise but inspiring.",
        }
      });

      // Fix: role model instead of assistant, text instead of content, new Date() for timestamp
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      // Fix: ChatMessage type compliance
      setMessages(prev => [...prev, {
        id: 'err',
        role: 'model',
        text: 'Error: Failed to connect to Gemini. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 py-6">
      <div 
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto mb-6 pr-2 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="p-4 bg-gray-800 rounded-full">
              <Bot className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold">Start a conversation</h2>
            <p className="max-w-xs text-sm">Ask Gemini for creative inspiration, code, or ideas.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800 border border-gray-700'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-gray-800/50 border border-gray-700 text-gray-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gray-950 pb-6 pt-2">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Gemini anything..."
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none shadow-xl"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          Gemini may display inaccurate info, including about people, so double-check its responses.
        </p>
      </div>
    </div>
  );
};

export default ChatView;