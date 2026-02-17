import React from 'react';
import { FunnelStage } from '../../types';

interface FunnelChartProps {
  data: FunnelStage[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 h-full w-full flex flex-col">
      <h3 className="text-gray-500 font-medium mb-3 text-sm">Воронка</h3>

      <div className="flex flex-col gap-2 flex-1 justify-center">
        {data.map((item, index) => {
          const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const barWidth = Math.max(pct, 8);

          return (
            <div key={index} className="flex items-center gap-3">
              {/* Label */}
              <span className="text-xs text-gray-900 font-bold w-24 text-right shrink-0 truncate">
                {item.label}
              </span>

              {/* Bar area */}
              <div className="flex-1 relative">
                <div className="w-full h-7 relative flex items-center">
                  {/* Bar fill — tapers from left to right creating a funnel shape */}
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-ordo-green/80 to-ordo-green/40 transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${barWidth}%` }}
                  >
                    {barWidth > 20 && (
                      <span className="text-[10px] font-bold text-white/90 font-mono whitespace-nowrap">
                        {item.displayValue}
                      </span>
                    )}
                  </div>
                  {barWidth <= 20 && (
                    <span className="ml-2 text-[10px] font-bold text-gray-700 font-mono whitespace-nowrap">
                      {item.displayValue}
                    </span>
                  )}
                </div>
              </div>

              {/* Conversion badge */}
              <span className={`text-xs font-bold font-mono w-14 text-right shrink-0 ${
                item.conversionRate >= 10 ? 'text-ordo-green' : item.conversionRate >= 1 ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {item.conversionRate}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelChart;
