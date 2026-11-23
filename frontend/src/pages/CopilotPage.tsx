import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Undo2,
  Redo2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Box,
  Sparkles,
  ArrowRight,
  Terminal,
  Activity
} from 'lucide-react';

interface CopilotCommandResult {
  command_text: string;
  operation: string;
  params: Record<string, unknown>;
  changes_made: string[];
  confirmation_text: string;
  layout_updated: boolean;
  undo_available: boolean;
  redo_available: boolean;
}

type MessageRole = 'user' | 'ai' | 'error';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  result?: CopilotCommandResult;
  timestamp: Date;
}

interface CopilotPageProps {
  activeProjectId: string;
  onNavigateTab: (tabId: string) => void;
}

const EXAMPLE_PROMPTS: string[] = [
  'Add 2 server racks to Row-A',
  'Set room length to 8.27m and width to 6.0m',
  'Add 3 precision UKG cooling units (15 kW)',
  'Increase central hot aisle spacing to 1.5m',
  'Add central hot-aisle ceiling containment',
  'Configure dual-corded UPS power feeds',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  text: "Welcome to the AI Design Copilot. Describe layout, cooling, electrical, or structural adjustments using natural language. I will modify the geometric model and synchronize both the 2D floor plan and the 3D digital twin in real time.",
  timestamp: new Date(),
};

const OperationBadge: React.FC<{ operation: string }> = ({ operation }) => (
  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-electric-teal/15 border border-electric-teal/30 text-electric-teal mb-1.5 shadow-[0_0_8px_rgba(0,214,201,0.2)]">
    {operation}
  </span>
);

const SyncBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-controlled-emerald/15 border border-controlled-emerald/30 text-controlled-emerald mt-1.5 shadow-[0_0_8px_rgba(0,184,148,0.2)]">
    <CheckCircle className="w-3.5 h-3.5" />
    <span>Layout &amp; 3D Scene Synchronized</span>
  </span>
);

export const CopilotPage: React.FC<CopilotPageProps> = ({
  activeProjectId,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [redoAvailable, setRedoAvailable] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: new Date() },
    ]);
  }, []);

  const updateUndoRedo = (result: CopilotCommandResult) => {
    setUndoAvailable(result.undo_available);
    setRedoAvailable(result.redo_available);
  };

  const sendCommand = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const userText = message.trim();
      setInputText('');
      setIsLoading(true);

      addMessage({ role: 'user', text: userText });

      try {
        const res = await fetch('/api/copilot/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: activeProjectId, message: userText }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errBody?.detail ?? 'Command failed');
        }

        const result: CopilotCommandResult = await res.json();
        updateUndoRedo(result);
        addMessage({ role: 'ai', text: result.confirmation_text, result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        addMessage({ role: 'error', text: `Error: ${msg}` });
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [activeProjectId, isLoading, addMessage]
  );

  const handleUndo = useCallback(async () => {
    if (!undoAvailable || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/copilot/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: activeProjectId }),
      });
      if (!res.ok) throw new Error('Undo failed');
      const data = await res.json();
      setUndoAvailable(data.undo_available ?? false);
      setRedoAvailable(data.redo_available ?? true);
      addMessage({ role: 'ai', text: data.message ?? 'Undo applied.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Undo failed.';
      addMessage({ role: 'error', text: `Error: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId, undoAvailable, isLoading, addMessage]);

  const handleRedo = useCallback(async () => {
    if (!redoAvailable || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/copilot/redo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: activeProjectId }),
      });
      if (!res.ok) throw new Error('Redo failed');
      const data = await res.json();
      setUndoAvailable(data.undo_available ?? true);
      setRedoAvailable(data.redo_available ?? false);
      addMessage({ role: 'ai', text: data.message ?? 'Redo applied.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Redo failed.';
      addMessage({ role: 'error', text: `Error: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId, redoAvailable, isLoading, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendCommand(inputText);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-graphite/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden font-sans text-warm-ivory">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-titanium-charcoal/40 backdrop-blur-md">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-titanium-charcoal border border-white/10 flex items-center justify-center text-electric-teal shadow-[0_0_15px_rgba(0,214,201,0.2)]">
            <Sparkles className="w-5 h-5 text-electric-teal" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-electric-teal font-bold flex items-center gap-1.5">
              <Terminal className="w-3 h-3" />
              Parametric Engineering Assistant
            </span>
            <h1 className="text-xl font-serif font-bold text-warm-ivory leading-tight">
              AI Design Copilot
            </h1>
            <p className="text-xs text-muted-silver font-mono">
              Natural Language Spatial Layout &amp; Architecture Control
            </p>
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleUndo}
            disabled={!undoAvailable || isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              undoAvailable && !isLoading
                ? 'bg-titanium-charcoal border-white/15 text-warm-ivory hover:border-electric-teal/40 cursor-pointer shadow-xs'
                : 'bg-titanium-charcoal/40 border-white/5 text-muted-silver/40 opacity-50 cursor-not-allowed'
            }`}
            title="Undo last change"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleRedo}
            disabled={!redoAvailable || isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              redoAvailable && !isLoading
                ? 'bg-titanium-charcoal border-white/15 text-warm-ivory hover:border-electric-teal/40 cursor-pointer shadow-xs'
                : 'bg-titanium-charcoal/40 border-white/5 text-muted-silver/40 opacity-50 cursor-not-allowed'
            }`}
            title="Redo last change"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* Chat feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-obsidian/40 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[70%] px-5 py-3 rounded-2xl rounded-br-sm bg-titanium-charcoal border border-white/15 text-warm-ivory font-medium text-sm shadow-md leading-relaxed">
                  {msg.text}
                </div>
              ) : msg.role === 'error' ? (
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 backdrop-blur-md">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="text-rose-300 text-xs font-mono leading-relaxed">{msg.text}</span>
                </div>
              ) : (
                <div className="max-w-[85%] p-5 rounded-2xl rounded-bl-sm bg-graphite/90 border border-white/10 shadow-lg space-y-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-titanium-charcoal text-electric-teal flex items-center justify-center">
                      <Box className="w-3 h-3 text-electric-teal" />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-electric-teal">
                      COPILOT ENGINE
                    </span>
                  </div>

                  {msg.result && <OperationBadge operation={msg.result.operation} />}

                  <p className="text-sm text-warm-ivory leading-relaxed">{msg.text}</p>

                  {msg.result && msg.result.changes_made.length > 0 && (
                    <ul className="text-xs font-mono text-muted-silver space-y-1 pl-4 list-disc">
                      {msg.result.changes_made.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  )}

                  {msg.result?.layout_updated && <SyncBadge />}

                  {msg.result && (
                    <button
                      onClick={() => onNavigateTab('simulator')}
                      className="mt-2 text-xs font-mono font-bold text-electric-teal hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Explore adjustments in 3D Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-titanium-charcoal border border-white/10 text-electric-teal flex items-center justify-center shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-electric-teal" />
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-graphite border border-white/10 text-xs font-mono text-muted-silver shadow-xs flex items-center gap-2">
              <span>Computing layout modifications & metric constraints...</span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-white/10 bg-titanium-charcoal/50 backdrop-blur-md p-4 space-y-3">
        {/* Example prompt chips */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendCommand(prompt)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full border border-white/10 bg-graphite/80 hover:border-electric-teal/40 hover:text-electric-teal text-muted-silver text-[11px] font-mono cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type a spatial or structural modification command... (e.g. 'Add 2 server racks to Row-A')"
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-graphite/90 text-sm text-warm-ivory placeholder-muted-silver/50 focus:outline-none focus:border-electric-teal shadow-xs transition-colors font-sans"
          />

          <button
            onClick={() => sendCommand(inputText)}
            disabled={isLoading || !inputText.trim()}
            className="w-12 h-12 rounded-xl btn-primary-teal flex items-center justify-center cursor-pointer transition-all shadow-[0_0_15px_rgba(0,214,201,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send command"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopilotPage;