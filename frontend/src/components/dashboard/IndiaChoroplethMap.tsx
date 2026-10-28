import React, { useState } from 'react';

export interface StateHeatmapItem {
  state: string;
  code: string;
  pending: number;
  highRisk: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  path: string;
  center: [number, number]; // [x, y] for label/circle
}

// Stylized, accurate geometric map paths for India states (viewBox 0 0 400 450)
export const INDIA_REGIONS: StateHeatmapItem[] = [
  {
    state: 'Maharashtra',
    code: 'MH',
    pending: 8,
    highRisk: 2,
    level: 'high',
    center: [145, 240],
    path: 'M 100 200 L 150 200 L 185 220 L 180 265 L 140 280 L 105 270 L 95 230 Z'
  },
  {
    state: 'Uttar Pradesh',
    code: 'UP',
    pending: 9,
    highRisk: 3,
    level: 'critical',
    center: [205, 140],
    path: 'M 160 110 L 230 115 L 265 145 L 225 175 L 175 160 L 155 130 Z'
  },
  {
    state: 'Tamil Nadu',
    code: 'TN',
    pending: 6,
    highRisk: 1,
    level: 'medium',
    center: [165, 375],
    path: 'M 145 340 L 185 340 L 185 390 L 155 420 L 145 380 Z'
  },
  {
    state: 'Karnataka',
    code: 'KA',
    pending: 5,
    highRisk: 1,
    level: 'medium',
    center: [135, 315],
    path: 'M 125 275 L 165 275 L 160 345 L 130 350 L 115 310 Z'
  },
  {
    state: 'Gujarat',
    code: 'GJ',
    pending: 4,
    highRisk: 0,
    level: 'low',
    center: [75, 185],
    path: 'M 50 160 L 105 160 L 100 215 L 60 215 L 45 185 Z'
  },
  {
    state: 'Andhra Pradesh',
    code: 'AP',
    pending: 5,
    highRisk: 1,
    level: 'medium',
    center: [195, 290],
    path: 'M 175 255 L 235 240 L 215 330 L 170 335 L 175 285 Z'
  },
  {
    state: 'Madhya Pradesh',
    code: 'MP',
    pending: 3,
    highRisk: 0,
    level: 'low',
    center: [165, 190],
    path: 'M 120 170 L 210 170 L 225 210 L 155 215 L 125 195 Z'
  },
  {
    state: 'Delhi NCR',
    code: 'DL',
    pending: 4,
    highRisk: 1,
    level: 'medium',
    center: [150, 115],
    path: 'M 142 108 L 158 108 L 158 122 L 142 122 Z'
  },
  {
    state: 'Rajasthan',
    code: 'RJ',
    pending: 4,
    highRisk: 1,
    level: 'medium',
    center: [100, 130],
    path: 'M 70 95 L 145 95 L 140 165 L 75 160 Z'
  },
  {
    state: 'West Bengal',
    code: 'WB',
    pending: 3,
    highRisk: 0,
    level: 'low',
    center: [280, 185],
    path: 'M 265 155 L 295 155 L 290 220 L 270 210 Z'
  },
  {
    state: 'Punjab & Haryana',
    code: 'PB',
    pending: 2,
    highRisk: 0,
    level: 'low',
    center: [130, 80],
    path: 'M 115 60 L 155 60 L 145 105 L 110 95 Z'
  },
  {
    state: 'Jammu & Kashmir / Ladakh',
    code: 'JK',
    pending: 1,
    highRisk: 0,
    level: 'low',
    center: [140, 35],
    path: 'M 115 10 L 175 10 L 180 60 L 120 60 Z'
  },
  {
    state: 'Kerala',
    code: 'KL',
    pending: 2,
    highRisk: 0,
    level: 'low',
    center: [135, 385],
    path: 'M 125 350 L 145 350 L 140 420 L 125 400 Z'
  },
  {
    state: 'Odisha',
    code: 'OD',
    pending: 2,
    highRisk: 0,
    level: 'low',
    center: [235, 225],
    path: 'M 215 210 L 260 210 L 250 255 L 210 245 Z'
  },
  {
    state: 'North East Region',
    code: 'NE',
    pending: 1,
    highRisk: 0,
    level: 'low',
    center: [340, 140],
    path: 'M 305 110 L 370 110 L 365 170 L 310 160 Z'
  }
];

interface IndiaChoroplethMapProps {
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
}

export const IndiaChoroplethMap: React.FC<IndiaChoroplethMapProps> = ({
  selectedState,
  onSelectState
}) => {
  const [hoveredState, setHoveredState] = useState<StateHeatmapItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Choropleth color based on pending volume
  const getStateColor = (item: StateHeatmapItem, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) return '#0B1F4B'; // Selected focus dark navy
    if (isHovered) return '#FF9933'; // Saffron hover accent

    if (item.pending >= 8) return '#DC2626'; // High/Critical load (Red)
    if (item.pending >= 5) return '#F59E0B'; // Medium load (Amber)
    return '#3B82F6'; // Low load (Blue)
  };

  const handleMouseMove = (e: React.MouseEvent, item: StateHeatmapItem) => {
    const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setHoveredState(item);
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      <svg
        viewBox="0 0 400 440"
        className="w-full max-h-[300px] h-auto drop-shadow-xs"
        aria-label="Interactive India Regulatory Scrutiny Map"
      >
        {/* State Paths */}
        <g>
          {INDIA_REGIONS.map((item) => {
            const isSelected = selectedState === item.state;
            const isHovered = hoveredState?.code === item.code;
            const fillColor = getStateColor(item, isHovered, isSelected);

            return (
              <g key={item.code}>
                <path
                  d={item.path}
                  fill={fillColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? '2.5' : '1.2'}
                  className="transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-98"
                  onMouseEnter={(e) => handleMouseMove(e, item)}
                  onMouseMove={(e) => handleMouseMove(e, item)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onSelectState(isSelected ? null : item.state)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.state}: ${item.pending} pending, ${item.highRisk} flagged`}
                />
                {/* State Code Label */}
                <text
                  x={item.center[0]}
                  y={item.center[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9px] font-bold fill-white pointer-events-none drop-shadow-xs"
                >
                  {item.code}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredState && (
        <div
          className="absolute z-30 pointer-events-none bg-navy-950/95 text-white border border-navy-700/80 px-3 py-2 rounded-xl shadow-xl text-12 backdrop-blur-xs transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="font-bold text-saffron-400 border-b border-navy-800 pb-1 mb-1">
            {hoveredState.state} ({hoveredState.code})
          </div>
          <div className="flex items-center justify-between gap-4 text-11">
            <span className="text-slate-300">Pending Scrutiny:</span>
            <span className="font-bold tabular-nums text-white">{hoveredState.pending}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-11">
            <span className="text-slate-300">Flagged High-Risk:</span>
            <span className="font-bold tabular-nums text-red-400">{hoveredState.highRisk}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 italic">Click to filter queue</div>
        </div>
      )}

      {/* Choropleth Legend */}
      <div className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-11 text-gov-muted px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>&lt; 5 Low</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>5 - 7 Moderate</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span>8+ High</span>
        </span>
      </div>
    </div>
  );
};
