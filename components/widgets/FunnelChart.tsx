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

interface BarItem {
  label: string;
  value: number;
  displayValue: string;
}

const BarSection: React.FC<{
  title: string;
  bars: BarItem[];
  gradient: string;
}> = ({ title, bars, gradient }) => {
  const maxValue = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100/80 shadow-md shadow-sky-100/20 flex flex-col">
      <span className="text-sm font-semibold text-gray-900 mb-3">{title}</span>
      <div className="flex items-end gap-2 flex-1 min-h-[160px]">
        {bars.map((item, index) => {
          const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const barHeight = Math.max(pct, 6);

          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[10px] font-bold text-gray-700 font-mono mb-1 whitespace-nowrap">
                {item.displayValue}
              </span>
              <div
                className={`w-full rounded-t-md ${gradient} transition-all duration-500 min-h-[4px]`}
                style={{ height: `${barHeight}%` }}
              />
              <span className="text-[9px] text-gray-900 font-bold mt-1.5 text-center leading-tight truncate w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  adminMetrics = defaultAdminMetrics,
  doctorMetrics = defaultDoctorMetrics,
}) => {
  const adminBars: BarItem[] = [
    { label: 'Запись', value: adminMetrics.appointmentsScheduled, displayValue: formatNumber(adminMetrics.appointmentsScheduled) },
    { label: 'Дошедшие', value: adminMetrics.appointmentsAttended, displayValue: formatNumber(adminMetrics.appointmentsAttended) },
    { label: 'Продажи', value: adminMetrics.salesCount, displayValue: formatNumber(adminMetrics.salesCount) },
    { label: 'Конв. запись', value: adminMetrics.conversionToAppointment, displayValue: `${adminMetrics.conversionToAppointment}%` },
    { label: 'Конв. приход', value: adminMetrics.conversionToShowUp, displayValue: `${adminMetrics.conversionToShowUp}%` },
  ];

  const doctorBars: BarItem[] = [
    { label: 'Средний чек', value: doctorMetrics.averageCheck, displayValue: `$${formatNumber(doctorMetrics.averageCheck)}` },
    { label: 'Конв. тотал', value: doctorMetrics.conversionToTotal, displayValue: `${doctorMetrics.conversionToTotal}%` },
  ];

  const funnelBars: BarItem[] = data.map(d => ({
    label: d.label,
    value: d.value,
    displayValue: d.displayValue,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-900">Воронка</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BarSection
          title="Таргетолог"
          bars={funnelBars}
          gradient="bg-gradient-to-t from-ordo-green/80 to-ordo-green/40"
        />
        <BarSection
          title="Администратор"
          bars={adminBars}
          gradient="bg-gradient-to-t from-blue-500/80 to-blue-400/40"
        />
        <BarSection
          title="Врачи/Куратор"
          bars={doctorBars}
          gradient="bg-gradient-to-t from-purple-500/80 to-purple-400/40"
        />
      </div>
    </div>
  );
};

export default FunnelChart;
