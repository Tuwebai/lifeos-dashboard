
import React, { useState, useRef, useEffect } from 'react';
// Corrected import to use ChatMessage instead of Message
import { ChatMessage } from '../types';
import { geminiService } from '../services/gemini';

const ChatInterface: React.FC = () => {
  // Corrected type to ChatMessage
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your Gemini assistant. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Corrected type to ChatMessage
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await geminiService.chat(input, history);
      
      // Corrected type to ChatMessage
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      // Corrected type to ChatMessage
      const errorMsg: ChatMessage = {
        id: 'err',
        role: 'model',
        text: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pb-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-slate-800 text-slate-100 border border-slate-700'
            }`}>
              <div className="text-xs opacity-50 mb-1 flex justify-between gap-4">
                <span className="font-bold uppercase tracking-tighter">{msg.role === 'user' ? 'You' : 'Gemini'}</span>
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex gap-2 items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 sticky bottom-0 bg-slate-950">
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
            placeholder="Type your message here..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 pr-16 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none min-h-[60px] max-h-[200px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-3 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/40"
          >
            <i className={`fas ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">Gemini may display inaccurate info, including about people, so double-check its responses.</p>
      </div>
    </div>
  );
};

export default ChatInterface;
