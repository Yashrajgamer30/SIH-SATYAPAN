import React, { useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onChange,
  className = ""
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter(t => !t.disabled);
    const currentIndex = enabledTabs.findIndex(t => t.id === tabs[index].id);

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledTabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      onChange(nextTab.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[tabs.findIndex(t => t.id === nextTab.id)]?.focus();
    }
  };

  return (
    <div className={`border-b border-gov-border ${className}`}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation="horizontal"
        className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative py-3 px-3 sm:px-4 text-14 font-semibold inline-flex items-center gap-2 border-b-2 transition-all duration-200 outline-none select-none cursor-pointer whitespace-nowrap
                ${isActive
                  ? 'border-saffron-500 text-navy-900 dark:text-saffron-500 font-bold'
                  : 'border-transparent text-gov-muted hover:text-gov-text hover:border-gov-border'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                focus-visible:ring-2 focus-visible:ring-saffron-500 focus-visible:rounded-t
              `}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-11 px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                  isActive ? 'bg-saffron-500 text-slate-900' : 'bg-gov-subtle text-gov-muted border border-gov-border'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
