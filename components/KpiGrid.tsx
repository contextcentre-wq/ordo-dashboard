import React, { useState } from 'react';
import { Metric } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface KpiGridProps {
  metrics: Metric[];
}

const TOOLTIP_MAP: Record<string, string> = {
  CPM: 'Стоимость за 1000 показов',
  CPC: 'Стоимость клика',
  CTR: 'Кликабельность рекламы (Клики / Показы × 100%)',
  CPR: 'Стоимость результата (цель рекламной кампании)',
  CPL: 'Стоимость лида',
  CPqL: 'Стоимость квалифицированного лида',
  CPS: 'Стоимость продажи',
  AOV: 'Средний чек продажи',
  CPShow: 'Цена за дошедшего на приём',
};

const TooltipIcon: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-gray-300 text-[8px] cursor-help border border-gray-200 rounded-full w-2.5 h-2.5 flex items-center justify-center leading-none">
        i
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] text-white bg-gray-800 rounded-md whitespace-nowrap z-50 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
};

const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  const isMobile = useIsMobile();
  return (
    <div className="w-full bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Показатели рекламы</h3>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-x-4 gap-y-2`}>
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-semibold text-gray-400 uppercase tracking-wide`}>
                {metric.label}
              </span>
              <TooltipIcon text={TOOLTIP_MAP[metric.label] ?? metric.label} />
            </div>
            <span className="text-sm md:text-base font-bold text-gray-900 font-mono">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpiGrid;
