'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TacticalAssistant({ matchContext }: { matchContext: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, matchContext }),
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              last.content = assistantContent;
            }
            return updated;
          });
        }
      }

      if (!assistantContent.trim()) {
        throw new Error('Received an empty response. You may have hit the API rate limit. Please wait a minute and try again.');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Connection failed.');
      // Remove the empty assistant message if it failed
      setMessages(prev => prev.filter(m => m.content.trim() !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-colors z-50 flex items-center justify-center"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>

      {/* Slide-out Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)]"
          >
            {/* Header */}
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-3">
              <div className="bg-red-600/20 p-2 rounded-lg">
                <Bot className="text-red-500" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Tactical Assistant</h3>
                <p className="text-xs text-slate-400">Powered by Gemini AI</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                  <Bot size={48} className="text-slate-700" />
                  <p className="text-center text-sm">
                    Ask me anything about this match's tactics, xG, possession, or player stats!
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      m.role === 'user' ? 'bg-red-600/20' : 'bg-slate-800'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <User size={16} className="text-red-500" />
                    ) : (
                      <Bot size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === 'user'
                        ? 'bg-red-600 text-white rounded-tr-sm'
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm ml-12">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-200" />
                </div>
              )}
            </div>

            {/* Input Area */}
            {error && (
              <div className="px-4 py-2 bg-red-900/50 text-red-200 text-xs text-center border-t border-red-800">
                {error}
              </div>
            )}
            <form 
              onSubmit={onSubmit} 
              className="p-4 bg-slate-800 border-t border-slate-700"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about tactics..."
                  className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-full transition-colors flex items-center justify-center"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
