import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface RoasGaugeProps {
  value: number;
}

const RoasGauge: React.FC<RoasGaugeProps> = ({ value }) => {
  const isMobile = useIsMobile();
  const minVal = -100;
  const maxVal = 300;
  const normalized = Math.max(minVal, Math.min(value, maxVal));
  const percentPos = ((normalized - minVal) / (maxVal - minVal)) * 100;

  // 5 color segments for the bar
  const segments = [
    { color: '#EF4444', label: '-100' },
    { color: '#F59E0B', label: '0' },
    { color: '#FBBF24', label: '100' },
    { color: '#38BDF8', label: '200' },
    { color: '#0284C7', label: '300' },
  ];

  return (
    <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 h-full flex flex-col">
      <div className="flex justify-between items-center mb-auto">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          ROAS <span className="text-gray-300 cursor-help text-[10px]">&oplus;</span>
        </h3>
        <span className="text-lg font-bold text-gray-900 font-mono">{value}%</span>
      </div>

      {/* Color bar */}
      <div className="mt-auto">
        {/* Scale labels — above bar */}
        <div className="flex justify-between mb-1">
          {segments.map((seg, i) => (
            <span key={i} className={`${isMobile ? 'text-[10px]' : 'text-[8px]'} text-gray-400 font-mono`}>{seg.label}</span>
          ))}
        </div>

        <div className="relative">
          {/* Segmented bar */}
          <div className={`flex ${isMobile ? 'h-3.5' : 'h-2.5'} rounded-full overflow-hidden`}>
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: seg.color }}
              />
            ))}
          </div>

          {/* Triangle pointer — below bar */}
          <div
            className="absolute -bottom-3 transition-all duration-500"
            style={{ left: `${percentPos}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '6px solid #1F2937',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoasGauge;
