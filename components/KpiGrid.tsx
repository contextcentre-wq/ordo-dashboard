import React from 'react';
import { Metric } from '../types';

interface KpiGridProps {
  metrics: Metric[];
}

const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 w-full bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
      {metrics.map((metric, idx) => (
        <div key={idx} className="flex flex-col space-y-1 p-2 border-r last:border-r-0 border-gray-100 border-dashed md:border-solid md:last:border-none">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{metric.label}</span>
            <span className="text-gray-300 text-[10px] cursor-help border border-gray-200 rounded-full w-3 h-3 flex items-center justify-center">i</span>
          </div>
          <span className="text-lg md:text-xl font-bold text-gray-900 font-mono">{metric.value}</span>
        </div>
      ))}
    </div>
  );
};

export default KpiGrid;