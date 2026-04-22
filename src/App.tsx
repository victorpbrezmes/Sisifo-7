import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
};

const INITIAL_MESSAGE = "¡Atención, Cadete! Bienvenido a la Sísifo-7. Los filtros de aire están a medio gas y necesito a alguien que sepa de números para que no salgamos volando. ¿Estás listo para tu primer desafío de telemetría de 5º curso? Dime tu nombre y empezamos.";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: INITIAL_MESSAGE }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oxygen, setOxygen] = useState(14.2);
  const [hull, setHull] = useState(88.4);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simulación de telemetría dinámica
  useEffect(() => {
    const interval = setInterval(() => {
      setOxygen(prev => +(prev + (Math.random() * 0.2 - 0.1)).toFixed(1));
      setHull(prev => +(prev + (Math.random() * 0.1 - 0.05)).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user' as const, content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const SYSTEM_PROMPT = `
        Actúa siguiendo estrictamente las directrices de este esquema P.R.O.F.E. para interactuar con el estudiante.
        1. P - PERSONALIDAD: Identidad: Eres el Ingeniero Jefe de la estación "Sísifo-7". Tono: Pragmático pero alentador. Habla como si estuvieras en una radio de corto alcance.
        2. R - ROL: Mentor de un "Cadete de Telemetría" (Nivel: 10-11 años / 5º Primaria). Eres su guía y protector.
        3. O - OBJETIVO: Mantener una conversación interactiva y plantear desafíos matemáticos de 5º de Primaria (fracciones, decimales, áreas, volúmenes) aplicados a la estación.
        4. F - FORMATO: Sé breve. Usa oraciones directas. Usa $...$ para números o fórmulas. No más de 80 palabras.
        5. E - EXCEPCIONES: No rompas el personaje.
      `;

      const chatHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite-preview',
        contents: [...chatHistory, { role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      let botContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of responseStream) {
        if (chunk.text) {
          botContent += chunk.text;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: botContent };
            return next;
          });
        }
      }
    } catch (error: any) {
      console.error("Error de conexión:", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `ERROR DE TELEMETRÍA: ${error?.message || "La señal se ha perdido en el cinturón de asteroides."}`,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = newHeight + 'px';
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f1115] text-[#d1d5db] font-mono select-none relative">
      {/* TOP BAR / HEADER */}
      <header className="h-16 bg-[#1a1d24] border-b border-[#374151] flex items-center justify-between px-4 sm:px-6 shadow-2xl shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-10 h-10 border-2 border-[#d97706] rounded-sm items-center justify-center">
            <div className="w-6 h-6 border border-[#d97706] rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#d97706]"></div>
            </div>
          </div>
          <div>
            <h1 className="text-[#d97706] font-bold text-lg sm:text-xl tracking-[0.2em] uppercase leading-tight">SÍSIFO-7</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block">Orbital Telemetry Terminal // Subsystem: Advanced Math</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Uplink Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#d97706] shadow-[0_0_8px_#d97706]"></div>
              <span className="text-[10px] sm:text-xs text-[#d97706] font-bold uppercase tracking-wider">Secure ES6 Link</span>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-[#374151]"></div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Core Temperature</span>
            <span className="text-[10px] sm:text-xs text-blue-400 font-bold">42.8°C</span>
          </div>
        </div>
      </header>

      {/* MAIN INTERFACE */}
      <div className="flex flex-1 overflow-hidden z-10">
        {/* LEFT SIDEBAR: TELEMETRY */}
        <aside className="w-64 bg-[#14171c] border-r border-[#374151] p-4 hidden lg:flex flex-col gap-6 overflow-y-auto shrink-0 scrollbar-hide">
          <section>
            <h2 className="text-[10px] text-[#d97706] font-bold uppercase mb-3 border-b border-[#d97706]/20 pb-1">Environmental Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] uppercase opacity-70">Oxygen Levels</span>
                <span className={cn("text-[10px] sm:text-xs font-bold", oxygen < 15 ? "text-red-500 animate-pulse" : "text-[#d97706]")}>
                  {oxygen}%
                </span>
              </div>
              <div className="w-full h-1 bg-[#1a1d24] rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-1000", oxygen < 15 ? "bg-red-500" : "bg-[#d97706]")} style={{ width: `${oxygen}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] uppercase opacity-70">Hull Integrity</span>
                <span className="text-[10px] sm:text-xs font-bold text-[#d97706]">{hull}%</span>
              </div>
              <div className="w-full h-1 bg-[#1a1d24] rounded-full overflow-hidden">
                <div className="bg-[#d97706] h-full transition-all duration-1000" style={{ width: `${hull}%` }}></div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] text-[#d97706] font-bold uppercase mb-3 border-b border-[#d97706]/20 pb-1">Orbital Vectors</h2>
            <div className="bg-black/40 p-3 rounded border border-[#374151] font-mono text-[10px] space-y-1">
              <div className="flex justify-between"><span className="opacity-50">VX:</span> <span>+7.652 km/s</span></div>
              <div className="flex justify-between"><span className="opacity-50">VY:</span> <span>-0.124 km/s</span></div>
              <div className="flex justify-between"><span className="opacity-50">VZ:</span> <span>+0.008 km/s</span></div>
              <div className="mt-2 pt-2 border-t border-[#374151]/50 flex justify-between">
                <span className="opacity-50">DECAY:</span> <span className="text-orange-400">CRITICAL</span>
              </div>
            </div>
          </section>

          <section className="mt-auto">
            <div className="p-3 bg-[#d97706]/10 border border-[#d97706]/30 rounded text-[10px] leading-relaxed">
              <span className="block text-[#d97706] font-bold mb-1">SYSTEM ADVISORY:</span>
              Express Proxy Function running. Logic hidden from client. API Key secured. KaTeX engine ready for LaTeX strings.
            </div>
          </section>
        </aside>

        {/* CHAT AREA */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("animate-fade-in flex flex-col gap-1", msg.role === 'assistant' ? "items-start" : "items-end")}>
                {msg.role === 'assistant' ? (
                  <>
                    <span className={cn("text-[10px] font-bold ml-1 uppercase tracking-wide", msg.isError ? "text-red-500" : "text-gray-500")}>
                      {msg.isError ? 'SISTEMA DE ALERTA' : 'Ingeniero Jefe [SISTEMA]'}
                    </span>
                    <div className={cn(
                      "bg-[#2d241e] text-[#fcd34d] p-4 rounded-br-xl rounded-tr-xl rounded-tl-xl max-w-[90%] sm:max-w-[85%] border border-dashed border-[#d97706] shadow-lg markdown-content text-sm leading-relaxed", 
                      msg.isError && "border-red-600 text-red-400 bg-red-950/50"
                    )}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-[#d97706] font-bold mr-1 uppercase tracking-wide">Aprendiz [TÚ]</span>
                    <div className="bg-[#1e2532] text-[#f3f4f6] p-4 rounded-bl-xl rounded-tl-xl rounded-tr-xl max-w-[90%] sm:max-w-[85%] border border-[#374151] shadow-inner text-left markdown-content text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                    </div>
                  </>
                )}
              </div>
            ))}
            {/* INDICADOR DE ESCRITURA */}
            {isLoading && (
              <div className="pb-4 transition-opacity duration-300">
                <div className="flex items-center gap-3 bg-[#2d241e]/50 w-max p-3 rounded-full border border-[#d97706]/20 opacity-80">
                  <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-tighter">Ingeniero Jefe está procesando datos</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#d97706] rounded-full animate-pulse transition-all"></div>
                    <div className="w-1.5 h-1.5 bg-[#d97706]/40 rounded-full animate-pulse transition-all delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-[#d97706]/10 rounded-full animate-pulse transition-all delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <footer className="bg-[#1a1d24] border-t border-[#374151] p-4 sm:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] shrink-0 z-20">
            <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4 flex-col sm:flex-row">
              <div className="relative flex-1">
                <div className="absolute -top-6 left-0 text-[9px] text-gray-500 uppercase tracking-widest hidden sm:block">Input Terminal // ready_for_command</div>
                <div className="bg-[#0f1115] border border-[#374151] rounded p-1 sm:p-2 text-sm text-[#d1d5db] focus-within:border-[#d97706] transition-colors flex items-center justify-between">
                  <textarea 
                    ref={textareaRef}
                    rows={1}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none rounded-lg p-2 resize-none focus:outline-none scrollbar-hide"
                    placeholder="Introduce parámetros de cálculo, aprendiz..."
                  />
                  {!inputValue && <span className="w-2 h-4 bg-[#d97706] animate-pulse shrink-0 mr-2"></span>}
                </div>
              </div>
              <button 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#d97706] hover:bg-[#b45309] text-white px-6 sm:px-8 py-3 rounded flex items-center justify-center transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed shrink-0"
                title="Transmitir datos"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </footer>
        </main>
      </div>
      
      {/* OVERLAY SCANLINE EFFECT */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%' }}></div>
    </div>
  );
}
