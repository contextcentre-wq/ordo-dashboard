import React from 'react';
import { FunnelStage } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';

interface FunnelChartProps {
  data: FunnelStage[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  const isMobile = useIsMobile();

  const height = 260;
  const barWidth = isMobile ? 44 : 76;
  const gap = isMobile ? 6 : 10;
  const margin = { top: 30, bottom: 30 };
  const badgeHeight = isMobile ? 18 : 22;
  const badgeWidth = isMobile ? 40 : 52;
  const valueFontSize = isMobile ? 10 : 13;
  const labelFontSize = isMobile ? 9 : 11;
  const badgeFontSize = isMobile ? 8 : 10;

  const maxValue = Math.max(...data.map(d => d.value));
  const maxBarHeight = height - margin.top - margin.bottom;
  const svgWidth = data.length * (barWidth + gap) - gap;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm h-full w-full flex flex-col">
      <h3 className="text-gray-500 font-medium mb-4 text-sm">Воронка</h3>

      <div className="flex-1 min-h-0">
        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${height}`} preserveAspectRatio="xMidYMax meet">

          {data.map((item, index) => {
            const x = index * (barWidth + gap);
            const barHeight = Math.max(30, (item.value / maxValue) * maxBarHeight);
            const y = height - margin.bottom - barHeight;
            const baseline = height - margin.bottom;

            return (
              <g key={index}>
                {/* Bar with top-only rounding */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#E5E5E5"
                  rx="8"
                  ry="8"
                />
                {/* Flat bottom cover */}
                <rect
                  x={x}
                  y={baseline - 8}
                  width={barWidth}
                  height={8}
                  fill="#E5E5E5"
                />

                {/* Conversion badge inside bar at bottom */}
                <rect
                  x={x + (barWidth - badgeWidth) / 2}
                  y={baseline - badgeHeight - 6}
                  width={badgeWidth}
                  height={badgeHeight}
                  rx={badgeHeight / 2}
                  fill="#2E7D32"
                />
                <text
                  x={x + barWidth / 2}
                  y={baseline - badgeHeight / 2 - 6 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={badgeFontSize}
                  fontWeight="bold"
                  fontFamily="ui-monospace, monospace"
                >
                  {item.conversionRate}%
                </text>

                {/* Value label above bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fill="#1F2937"
                  fontSize={valueFontSize}
                  fontWeight="700"
                >
                  {item.displayValue}
                </text>

                {/* Category label below bar */}
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize={labelFontSize}
                  fontWeight="500"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default FunnelChart;
