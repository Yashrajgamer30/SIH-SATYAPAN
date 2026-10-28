import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import { useTheme } from '../../context/ThemeContext';
import {
  HelpCircle, Send, Globe, Bot, ShieldCheck, Sparkles,
  MessageSquare, ChevronRight, RefreshCw, User
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  label?: string;
  timestamp: string;
}

export const SahayakHelpView: React.FC = () => {
  const { token } = useAuthStore();
  const { language: themeLang } = useTheme();

  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: 'Namaste! I am Sahayak, your AICTE Automated Regulatory Process Assistant. You can ask questions in English, Hindi, or Marathi regarding approval checklists, Fire NOC, Faculty Ratio norms, or deficiency rectification.',
      label: 'Automated help (AICTE Rule Engine)',
      timestamp: 'Just now'
    }
  ]);

  // Sync with global theme language if appropriate
  useEffect(() => {
    if (themeLang === 'hi' || themeLang === 'mr') {
      setLanguage(themeLang);
    }
  }, [themeLang]);

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const resp = await fetch(`http://localhost:8000/institute/sahayak/faqs?language=${language}`);
      if (resp.ok) {
        const json = await resp.json();
        setFaqs(json);
      }
    } catch (e) {
      console.warn('Could not load FAQs:', e);
    } finally {
      setLoadingFaqs(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [language]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsAsking(true);

    try {
      const resp = await fetch('http://localhost:8000/institute/sahayak/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q.trim(),
          language: language
        })
      });

      if (resp.ok) {
        const json = await resp.json();
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: 'assistant',
          text: json.answer,
          label: json.label,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (e) {
      console.error('Failed to query Sahayak:', e);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header & Language Switcher */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-10 font-bold bg-saffron-50 dark:bg-saffron-950 text-saffron-600 dark:text-saffron-400 border border-saffron-200 dark:border-saffron-800">
              Automated Help • Zero External LLM
            </span>
          </div>
          <h1 className="text-22 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-saffron-500" />
            <span>SAHAYAK: Process & Regulatory Assistant</span>
          </h1>
          <p className="text-12 text-gov-muted mt-1">
            Deterministic rule-based answers derived from the AICTE Approval Process Handbook (APH 2026-27).
          </p>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-lg text-12 font-bold transition-colors ${
              language === 'en' ? 'bg-saffron-500 text-white' : 'text-gov-text hover:bg-slate-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1 rounded-lg text-12 font-bold transition-colors ${
              language === 'hi' ? 'bg-saffron-500 text-white' : 'text-gov-text hover:bg-slate-200'
            }`}
          >
            हिंदी
          </button>
          <button
            onClick={() => setLanguage('mr')}
            className={`px-3 py-1 rounded-lg text-12 font-bold transition-colors ${
              language === 'mr' ? 'bg-saffron-500 text-white' : 'text-gov-text hover:bg-slate-200'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* 2. Common Process Topics Quick Click */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200 dark:border-navy-700 space-y-2">
        <div className="text-11 font-bold uppercase tracking-wider text-gov-muted flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-saffron-500" />
          <span>Quick Topic Selection ({language.toUpperCase()}):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {faqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => handleSendMessage(faq.question)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-saffron-400 text-12 font-semibold text-navy-950 dark:text-white transition-all shadow-2xs text-left"
            >
              {faq.question}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Interactive Chat Thread */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col h-[460px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m) => {
            const isBot = m.sender === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isBot ? 'items-start' : 'items-start justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-saffron-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl rounded-2xl p-4 text-13 space-y-1.5 ${
                  isBot
                    ? 'bg-slate-50 dark:bg-navy-800 text-gov-text border border-slate-200/80 dark:border-navy-700/80'
                    : 'bg-navy-900 text-white dark:bg-saffron-600'
                }`}>
                  {m.label && (
                    <div className="text-[10px] font-bold text-saffron-600 dark:text-saffron-300 uppercase tracking-wider">
                      {m.label}
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                  <div className={`text-[10px] text-right ${isBot ? 'text-gov-muted' : 'text-slate-300'}`}>
                    {m.timestamp}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-full bg-navy-800 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isAsking && (
            <div className="flex items-center gap-2 text-12 text-gov-muted">
              <Bot className="w-4 h-4 text-saffron-500" />
              <span>Sahayak is matching regulatory rules...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              language === 'hi'
                ? "यहाँ अपना प्रश्न लिखें (जैसे 'फायर एनओसी', 'संकाय अनुपात')..."
                : language === 'mr'
                ? "येथे प्रश्न विचारा (उदा. 'फायर एनओसी', 'प्राध्यापक प्रमाण')..."
                : "Ask a question about checklists, Fire NOC, FSR norms, deficiency reply..."
            }
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-13 text-gov-text placeholder:text-gov-muted focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isAsking}
            className="px-4 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 disabled:opacity-40 text-white font-bold text-13 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
