import React from 'react';
import { FunnelStage, AdminMetrics, DoctorMetrics } from '../../types';

interface FunnelChartProps {
  data: FunnelStage[];
  adminMetrics?: AdminMetrics;
  doctorMetrics?: DoctorMetrics;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function conversionColor(rate: number): string {
  if (rate >= 10) return 'text-ordo-green';
  if (rate >= 1) return 'text-amber-500';
  return 'text-gray-400';
}

const defaultAdminMetrics: AdminMetrics = {
  appointmentsScheduled: 0,
  appointmentsAttended: 0,
  salesCount: 0,
  conversionToAppointment: 0,
  conversionToShowUp: 0,
};

const defaultDoctorMetrics: DoctorMetrics = {
  averageCheck: 0,
  conversionToTotal: 0,
};

const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  adminMetrics = defaultAdminMetrics,
  doctorMetrics = defaultDoctorMetrics,
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-900">Воронка</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1 — Таргетолог */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 flex flex-col">
          <span className="text-sm font-semibold text-gray-900 mb-3">Таргетолог</span>
          <div className="flex items-end gap-2 flex-1 min-h-[160px]">
            {data.map((item, index) => {
              const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const barHeight = Math.max(pct, 6);

              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-bold text-gray-700 font-mono mb-1 whitespace-nowrap">
                    {item.displayValue}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-ordo-green/80 to-ordo-green/40 transition-all duration-500 min-h-[4px]"
                    style={{ height: `${barHeight}%` }}
                  />
                  <span className="text-[9px] text-gray-900 font-bold mt-1.5 text-center leading-tight truncate w-full">
                    {item.label}
                  </span>
                  <span className={`text-[9px] font-bold font-mono ${conversionColor(item.conversionRate)}`}>
                    {item.conversionRate}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2 — Администратор */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 flex flex-col">
          <span className="text-sm font-semibold text-gray-900 mb-3">Администратор</span>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <MetricRow label="Запись на прием" value={formatNumber(adminMetrics.appointmentsScheduled)} />
            <MetricRow label="Дошедшие" value={formatNumber(adminMetrics.appointmentsAttended)} />
            <MetricRow label="Продажи" value={formatNumber(adminMetrics.salesCount)} />
            <MetricRow
              label="Конв. в запись"
              value={`${adminMetrics.conversionToAppointment}%`}
              valueClassName={conversionColor(adminMetrics.conversionToAppointment)}
            />
            <MetricRow
              label="Конв. в приход"
              value={`${adminMetrics.conversionToShowUp}%`}
              valueClassName={conversionColor(adminMetrics.conversionToShowUp)}
            />
          </div>
        </div>

        {/* Card 3 — Врачи/Куратор */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 flex flex-col">
          <span className="text-sm font-semibold text-gray-900 mb-3">Врачи/Куратор</span>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <MetricRow label="Средний чек" value={`$${formatNumber(doctorMetrics.averageCheck)}`} />
            <MetricRow
              label="Конверсия в тотал"
              value={`${doctorMetrics.conversionToTotal}%`}
              valueClassName={conversionColor(doctorMetrics.conversionToTotal)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricRow: React.FC<{
  label: string;
  value: string;
  valueClassName?: string;
}> = ({ label, value, valueClassName }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-sm font-bold font-mono ${valueClassName ?? 'text-gray-900'}`}>
      {value}
    </span>
  </div>
);

export default FunnelChart;
