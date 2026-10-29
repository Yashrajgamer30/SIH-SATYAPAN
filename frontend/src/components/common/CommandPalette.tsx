import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Database,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'Applications' | 'Navigation' | 'Admin & Rules' | 'Tools';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ReactNode;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems: CommandItem[] = [
    {
      id: 'app-pune-402',
      category: 'Applications',
      title: 'AICTE/EOA/2026/MH-PUN-402',
      subtitle: 'Government College of Engineering - Pune (Risk Score 78.5)',
      path: '/official/applications/1',
      icon: <FileText className="w-4 h-4 text-rose-500" />
    },
    {
      id: 'app-nsk-108',
      category: 'Applications',
      title: 'AICTE/EOA/2026/MH-NSK-108',
      subtitle: 'Nashik Technical Polytechnic Institute (Awaiting Senior Approval)',
      path: '/official/applications/2',
      icon: <FileText className="w-4 h-4 text-amber-500" />
    },
    {
      id: 'app-mum-201',
      category: 'Applications',
      title: 'AICTE/EOA/2026/MH-MUM-201',
      subtitle: 'KJ Somaiya College of Engineering (Clean - Low Risk)',
      path: '/official/applications/3',
      icon: <FileText className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'nav-smart-queue',
      category: 'Navigation',
      title: 'Smart Scrutiny Queue',
      subtitle: 'Ranked regulatory queue sorted by AI risk score + SLA urgency',
      path: '/official/smart-queue',
      icon: <Sliders className="w-4 h-4 text-blue-500" />
    },
    {
      id: 'nav-verification-centre',
      category: 'Navigation',
      title: 'Verification Centre',
      subtitle: '6-status cross-issuing authority source verification hub',
      path: '/official/verification-centre',
      icon: <ShieldCheck className="w-4 h-4 text-teal-500" />
    },
    {
      id: 'nav-infra-compliance',
      category: 'Navigation',
      title: 'Infrastructure Compliance',
      subtitle: 'CAD floor plan overlays, geo-photos, and classroom/lab requirements',
      path: '/official/infra-compliance',
      icon: <Building className="w-4 h-4 text-indigo-500" />
    },
    {
      id: 'nav-cross-network',
      category: 'Tools',
      title: 'Cross-Institute Duplicate Network Graph',
      subtitle: 'Interactive map of shared documents, faculty, and forged seals',
      path: '/official/cross-network',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />
    },
    {
      id: 'nav-inspection-planner',
      category: 'Tools',
      title: 'Risk-Based Inspection Planner',
      subtitle: 'District-wise physical travel prioritisation and inspection briefs',
      path: '/official/inspection-planner',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
    },
    {
      id: 'nav-audit-security',
      category: 'Navigation',
      title: 'Audit & Security Centre',
      subtitle: 'Cryptographic SHA-256 hash chain verification and tamper demonstration',
      path: '/official/audit-security',
      icon: <Database className="w-4 h-4 text-emerald-600" />
    },
    {
      id: 'nav-admin-rules',
      category: 'Admin & Rules',
      title: 'Admin Rules & Checklists Builder',
      subtitle: 'Visual form UI over JSON regulatory threshold rules and rollback',
      path: '/official/admin/rules',
      icon: <Sliders className="w-4 h-4 text-blue-600" />
    },
    {
      id: 'nav-analytics',
      category: 'Navigation',
      title: 'Evaluation Benchmark & Analytics',
      subtitle: 'PS evaluation criteria on held-out split with manual effort model',
      path: '/official/analytics',
      icon: <CheckCircle2 className="w-4 h-4 text-cyan-600" />
    }
  ];

  // Global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = commandItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 rounded-lg text-xs font-medium transition-colors"
        title="Open Command Palette (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 text-slate-300" />
        <span className="hidden sm:inline text-slate-200">Search commands & dossiers...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/40 border border-white/20 rounded text-slate-300">
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, application number, or keyword..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No matching applications or regulatory commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-950 dark:text-blue-100'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-slate-900 dark:text-slate-100">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      {item.category}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {idx === selectedIndex && (
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px]">↵</kbd> to open
            </span>
          </div>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">SATYAPAN Command Desk</span>
        </div>
      </div>
    </div>
  );
};

