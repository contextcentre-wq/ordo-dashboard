import React from 'react';

interface RomiGaugeProps {
  value: number; // Percentage, e.g. 225.2
}

const RomiGauge: React.FC<RomiGaugeProps> = ({ value }) => {
  // Normalize value for gauge angle (-90 to 90 degrees)
  // Assume range -100% to 300% for visualization
  const minVal = -100;
  const maxVal = 300;
  const range = maxVal - minVal;
  const normalized = Math.max(minVal, Math.min(value, maxVal));
  const percentPos = (normalized - minVal) / range; // 0 to 1
  
  // Angle: 0 is top, -90 left, 90 right.
  // Actually usually gauges go from -90 (Left) to 90 (Right).
  const angle = -90 + (percentPos * 180);

  // SVG Geometry
  const radius = 80;
  const cx = 100;
  const cy = 90; // Move center down so we only see top half
  
  // Needle coordinates
  const needleLength = 70;
  const needleRad = (angle * Math.PI) / 180;
  const nx = cx + needleLength * Math.cos(needleRad);
  const ny = cy + needleLength * Math.sin(needleRad);

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col items-center relative">
       <div className="w-full flex justify-between items-start absolute top-4 px-4">
        <h3 className="text-gray-500 font-medium text-sm flex items-center gap-1">
          ROMI <span className="text-gray-300 cursor-help text-xs">ⓘ</span>
        </h3>
      </div>

      <div className="mt-8 relative w-full flex justify-center">
        <svg width="100%" height="110" viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet" className="max-w-[200px] mx-auto">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" /> {/* Red */}
              <stop offset="50%" stopColor="#EAB308" /> {/* Yellow */}
              <stop offset="100%" stopColor="#22C55E" /> {/* Green */}
            </linearGradient>
          </defs>
          
          {/* Gauge Background Track */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Colored Gauge */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Needle - Triangle */}
           <polygon 
            points={`${nx},${ny} ${cx-5},${cy} ${cx+5},${cy}`} 
            fill="#1F2937" 
            transform={`rotate(${0}, ${cx}, ${cy})`}
           />
           {/* Center Pivot */}
           <circle cx={cx} cy={cy} r="4" fill="#1F2937" />

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

export default RomiGauge;