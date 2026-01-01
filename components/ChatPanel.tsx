
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, ProjectFile } from '../types';
import { gemini } from '../services/geminiService';

interface ChatPanelProps {
  contextFile?: ProjectFile;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ contextFile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      // Added missing id property
      id: 'init-0',
      role: 'model',
      text: "Hello! I'm ready to review your React code. Once you upload your files, I can help you find bugs, optimize performance, or explain complex logic.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      // Added missing id property
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await gemini.chatWithCode(
        input, 
        contextFile?.name, 
        contextFile?.content
      );
      
      const modelMsg: ChatMessage = {
        // Added missing id property
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-400" />
        <h2 className="font-semibold text-sm">AI Assistant</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
              msg.role === 'model' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {msg.role === 'model' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[280px] shadow-sm ${
                msg.role === 'model' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-blue-600 text-white'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="Ask about the code..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[44px] max-h-32"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 mt-2 text-center">
          Powered by Gemini 3 Pro. High precision engineering.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
