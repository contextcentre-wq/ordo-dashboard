import React from 'react';
import Header from '../Header';
import FunnelChart from '../widgets/FunnelChart';
import IncomeExpenseWidget from '../widgets/IncomeExpenseWidget';
import RoasGauge from '../widgets/RomiGauge';
import KpiGrid from '../KpiGrid';
import { FunnelStage, Metric, Project } from '../../types';
import { Users, ShoppingCart, Megaphone, TrendingUp, ArrowUpRight } from 'lucide-react';

// MOCK DATA
const funnelData: FunnelStage[] = [
  { label: 'Охваты', value: 1600000, displayValue: '1.6 млн', conversionRate: 100 },
  { label: 'Показы', value: 1800000, displayValue: '1.8 млн', conversionRate: 113.6 },
  { label: 'Клики', value: 15156, displayValue: '15,156', conversionRate: 0.9 },
  { label: 'Результаты', value: 1834, displayValue: '1,834', conversionRate: 12.1 },
  { label: 'Лиды', value: 1254, displayValue: '1,254', conversionRate: 8.3 },
  { label: 'кЛиды', value: 414, displayValue: '414', conversionRate: 33 },
  { label: 'Продажи', value: 107, displayValue: '107', conversionRate: 25.8 },
];

const kpiMetrics: Metric[] = [
  { label: 'CPM', value: '$3.74' },
  { label: 'CPC', value: '$0.44' },
  { label: 'CTR', value: '0.85%' },
  { label: 'CPR', value: '$3.61' },
  { label: 'CPL', value: '$5.29' },
  { label: 'CPqL', value: '$16.01' },
  { label: 'CPS', value: '$61.95' },
  { label: 'AOV', value: '$201.47' },
  { label: 'ROAS', value: '225.2%' },
];

const topCampaigns = [
  { name: 'Remarketing Campaign Q3', results: 400, roas: 349.8 },
  { name: 'Cold Traffic - Lookalike 1%', results: 1434, roas: 197.6 },
  { name: 'LAL 1% — покупатели 90д', results: 870, roas: 228.1 },
  { name: 'Ретаргетинг — посетители', results: 250, roas: 356.8 },
  { name: 'Ретаргетинг — корзина', results: 150, roas: 339.8 },
];

const recentEvents = [
  { type: 'lead' as const, text: 'Новый лид — +7 701 *** 5678', time: '2 мин назад' },
  { type: 'sale' as const, text: 'Продажа — $450', time: '15 мин назад' },
  { type: 'lead' as const, text: 'Новый лид — +7 702 *** 6789', time: '28 мин назад' },
  { type: 'sale' as const, text: 'Продажа — $120', time: '1 ч назад' },
  { type: 'lead' as const, text: 'Новый лид — +7 705 *** 7890', time: '1.5 ч назад' },
  { type: 'campaign' as const, text: 'Кампания «LAL 1%» обновлена', time: '2 ч назад' },
];

const statCards = [
  { label: 'Всего лидов', value: '109', icon: Users, trend: '+12%' },
  { label: 'Всего продаж', value: '22', icon: ShoppingCart, trend: '+8%' },
  { label: 'Активных кампаний', value: '5', icon: Megaphone, trend: null },
  { label: 'Конверсия', value: '4.7%', icon: TrendingUp, trend: null },
];

const Dashboard: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div>
      <Header projectName={project.name} />
      {/* Top Section: Left metrics | Right funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left: stacked metric cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <IncomeExpenseWidget income={21557.49} expense={6629.09} />
            <RoasGauge value={225.2} />
          </div>
          <KpiGrid metrics={kpiMetrics} />
        </div>
        {/* Right: Funnel */}
        <div className="lg:col-span-7">
          <FunnelChart data={funnelData} />
        </div>
      </div>

      {/* Row 2 — Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-ordo-green" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-gray-900">{card.value}</span>
                  {card.trend && (
                    <span className="flex items-center text-xs font-medium text-emerald-600">
                      <ArrowUpRight className="w-3 h-3" />
                      {card.trend}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 3 — Top campaigns + Recent events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Top campaigns */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Топ кампании</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Кампания</th>
                <th className="text-right pb-2 font-medium">Результаты</th>
                <th className="text-right pb-2 font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 text-gray-700 truncate max-w-[120px] sm:max-w-[200px]">{c.name}</td>
                  <td className="py-2.5 text-right text-gray-900 font-medium">{c.results.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className={`font-medium ${c.roas >= 200 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {c.roas}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Последние события</h3>
          <div className="flex flex-col gap-3">
            {recentEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  event.type === 'sale' ? 'bg-emerald-500' :
                  event.type === 'lead' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
                <span className="text-sm text-gray-700 flex-1 truncate">{event.text}</span>
                <span className="text-xs text-gray-400 shrink-0">{event.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
