import React from 'react';

export const AshokaEmblem: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="currentColor" 
      className={className} 
      aria-hidden="true"
    >
      {/* Stylized Sarnath Lion Capital Emblem */}
      <circle cx="50" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M 42 16 Q 50 10 58 16" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="45" cy="20" r="1.5" />
      <circle cx="55" cy="20" r="1.5" />
      <path d="M 44 26 Q 50 30 56 26" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Side Lions */}
      <path d="M 36 24 C 26 26 24 38 34 46" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M 64 24 C 74 26 76 38 66 46" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Torso */}
      <path d="M 35 44 L 65 44 L 62 68 L 38 68 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="42" y1="46" x2="42" y2="66" stroke="currentColor" strokeWidth="1.5" />
      <line x1="50" y1="46" x2="50" y2="66" stroke="currentColor" strokeWidth="1.5" />
      <line x1="58" y1="46" x2="58" y2="66" stroke="currentColor" strokeWidth="1.5" />
      {/* Base Plinth */}
      <rect x="22" y="72" width="56" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      {/* Dharma Chakra Center */}
      <circle cx="50" cy="79" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="79" r="1.5" />
      {/* Galloping Horse and Bull flanking */}
      <path d="M 28 80 Q 34 76 38 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 62 80 Q 66 76 72 80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Lotus Pedestal */}
      <path d="M 26 90 Q 50 100 74 90" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Satyameva Jayate Banner text representation */}
      <rect x="20" y="102" width="60" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="50" y="111" fontSize="7" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="'Noto Sans Devanagari', 'Noto Sans', sans-serif">
        सत्यमेव जयते
      </text>
    </svg>
  );
};
