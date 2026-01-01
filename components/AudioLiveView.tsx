
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Radio, Activity, StopCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

const AudioLiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Audio helper functions
  const decode = (base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    if (isActive || isConnecting) return;
    setIsConnecting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Handle transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'model', text }];
              });
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'user', text }];
              });
            }
          },
          onerror: (e) => console.error('Live API error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    sessionPromiseRef.current?.then(s => s.close());
    sessionPromiseRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-6 gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Gemini Live Voice</h2>
        <p className="text-sm text-gray-500">Natural conversation with real-time audio</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-900/50 rounded-3xl border border-gray-800 custom-scrollbar">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
            <Radio className="w-12 h-12 mb-4" />
            <p>Start the session to talk</p>
          </div>
        ) : (
          transcripts.map((t, i) => (
            <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                t.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'
              }`}>
                {t.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          {!isActive ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="p-8 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-2xl transition-all disabled:opacity-50 group"
            >
              {isConnecting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />}
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="p-8 bg-red-600 hover:bg-red-500 rounded-full shadow-2xl transition-all animate-pulse"
            >
              <StopCircle className="w-8 h-8 text-white" />
            </button>
          )}
        </div>
        
        {isActive && (
          <div className="flex items-center gap-2 text-indigo-400 font-bold animate-pulse">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Live Streaming</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioLiveView;
