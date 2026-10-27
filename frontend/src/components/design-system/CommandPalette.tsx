import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Sliders, ShieldCheck, ArrowRight, CornerDownLeft } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample quick navigation commands
  const commands: CommandItem[] = [
    {
      id: 'cmd-eoa-pune',
      title: 'Open Saraswati IT Application (AICTE/EOA/2026/MH-PUNE-402)',
      category: 'Applications',
      shortcut: '↵',
      onSelect: () => {
        window.location.hash = '#app-1';
        setIsOpen(false);
      }
    },
    {
      id: 'cmd-eoa-nashik',
      title: 'Open Sahyadri College Deficiency Memo (AICTE/EOA/2026/MH-NSK-108)',
      category: 'Applications',
      shortcut: '↵',
      onSelect: () => {
        window.location.hash = '#app-2';
        setIsOpen(false);
      }
    },
    {
      id: 'cmd-rules-land',
      title: 'Configure Land Requirement Rule (LAND_AREA_COMPLIANCE)',
      category: 'APH 2026-27 Rules',
      shortcut: '↵',
      onSelect: () => {
        window.location.hash = '#rules';
        setIsOpen(false);
      }
    },
    {
      id: 'cmd-rules-fire',
      title: 'Configure Fire Safety Certificate Rule (FIRE_NOC_VALIDITY)',
      category: 'APH 2026-27 Rules',
      shortcut: '↵',
      onSelect: () => {
        window.location.hash = '#rules';
        setIsOpen(false);
      }
    },
    {
      id: 'cmd-styleguide',
      title: 'Navigate to Design System Styleguide (/styleguide)',
      category: 'Design System',
      shortcut: '↵',
      onSelect: () => {
        window.location.hash = '#styleguide';
        setIsOpen(false);
      }
    }
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].onSelect();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl bg-gov-surface border border-gov-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-gov-border">
          <Search className="w-5 h-5 text-gov-muted mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search applications, regulatory clauses, actions... (ESC to close)"
            className="w-full py-3.5 bg-transparent text-14 text-gov-text outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-11 font-mono text-gov-muted bg-gov-subtle border border-gov-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-gov-border/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-14 text-gov-muted">
              No regulatory actions or applications matching "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.onSelect()}
                  className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-navy-50 text-navy-900 font-semibold' : 'text-gov-text hover:bg-gov-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-gov-muted" />
                    <div>
                      <p className="text-14">{item.title}</p>
                      <p className="text-11 text-gov-muted">{item.category}</p>
                    </div>
                  </div>

                  <span className="flex items-center text-11 text-gov-muted font-mono">
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-2.5 bg-gov-subtle border-t border-gov-border flex items-center justify-between text-11 text-gov-muted">
          <span>Navigate with <kbd className="px-1 py-0.5 bg-gov-surface border border-gov-border rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-gov-surface border border-gov-border rounded">↓</kbd></span>
          <span>Execute with <kbd className="px-1 py-0.5 bg-gov-surface border border-gov-border rounded">↵</kbd></span>
        </div>
      </div>
    </div>
  );
};
