import React from 'react';

interface RoasGaugeProps {
  value: number;
}

const RoasGauge: React.FC<RoasGaugeProps> = ({ value }) => {
  const minVal = -100;
  const maxVal = 300;
  const range = maxVal - minVal;
  const normalized = Math.max(minVal, Math.min(value, maxVal));
  const percentPos = (normalized - minVal) / range;

  // SVG Geometry
  const cx = 100;
  const cy = 90;
  const radius = 75;

  // Needle
  const needleLength = 60;
  const needleAngle = Math.PI + percentPos * Math.PI; // PI (left) to 2*PI (right)
  const nx = cx + needleLength * Math.cos(needleAngle);
  const ny = cy + needleLength * Math.sin(needleAngle);

  // 5-color arc segments: red, orange, yellow, lime, teal
  const colors = ['#F31260', '#EA8C00', '#F3D42F', '#93D900', '#17C694'];
  const segmentAngle = Math.PI / colors.length;
  const strokeWidth = 14;

  const arcSegments = colors.map((color, i) => {
    const startAngle = Math.PI + i * segmentAngle;
    const endAngle = Math.PI + (i + 1) * segmentAngle;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col items-center relative">
      <div className="w-full flex justify-between items-start absolute top-4 px-4">
        <h3 className="text-gray-500 font-medium text-sm flex items-center gap-1">
          ROAS <span className="text-gray-300 cursor-help text-xs">&oplus;</span>
        </h3>
      </div>

      <div className="mt-8 relative w-full flex justify-center">
        <svg width="100%" height="110" viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet" className="max-w-[200px] mx-auto">
          {/* Background track */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* 5-color arc */}
          {arcSegments}

          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="5" fill="#1F2937" />
        </svg>

        {/* Value Text */}
        <div className="absolute bottom-0 left-0 w-full text-center">
          <span className="text-xl md:text-2xl font-bold text-gray-900">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoasGauge;
