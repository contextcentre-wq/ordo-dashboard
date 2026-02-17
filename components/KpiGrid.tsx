import React from 'react';
import { Metric } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface KpiGridProps {
  metrics: Metric[];
}

const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  const isMobile = useIsMobile();
  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-x-4 gap-y-2 w-full bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20`}>
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex flex-col">
          <div className="flex items-center space-x-1">
            <span className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-semibold text-gray-400 uppercase tracking-wide`}>{metric.label}</span>
            <span className="text-gray-300 text-[8px] cursor-help border border-gray-200 rounded-full w-2.5 h-2.5 flex items-center justify-center leading-none">i</span>
          </div>
          <span className="text-sm md:text-base font-bold text-gray-900 font-mono">{metric.value}</span>
        </div>
      ))}
    </div>
  );
};

export default KpiGrid;
