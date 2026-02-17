import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import Header from '../Header';
import FunnelChart from '../widgets/FunnelChart';
import IncomeExpenseWidget from '../widgets/IncomeExpenseWidget';
import RoasGauge from '../widgets/RomiGauge';
import KpiGrid from '../KpiGrid';
import { Target, DollarSign, UserCheck } from 'lucide-react';

const startTs = Date.now() - 30 * 24 * 60 * 60 * 1000;
const endTs = Date.now();

const Dashboard: React.FC<{ project: Doc<"projects"> }> = ({ project }) => {
  const data = useQuery(api.dashboard.getDashboardSummary, {
    projectId: project._id,
    startTs,
    endTs,
  });

  if (data === undefined) {
    return (
      <div>
        <Header projectName={project.name} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 h-32 animate-pulse" />
              <div className="bg-white rounded-2xl p-5 h-32 animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl p-5 h-48 animate-pulse" />
          </div>
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-5 h-80 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header projectName={project.name} />
      {/* Row 1 — Funnel (full width: 3 cards) */}
      <FunnelChart
        data={data.funnel}
        adminMetrics={data.adminMetrics}
        doctorMetrics={data.doctorMetrics}
      />

      {/* Row 2 — ROAS | KPI metrics | Доходы/Расходы */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <RoasGauge value={data.roasValue} />
        <KpiGrid metrics={data.kpis} />
        <IncomeExpenseWidget income={data.income} expense={data.expense} />
      </div>

      {/* Row 3 — Активных кампаний */}
      {(() => {
        const cs = data.campaignStats ?? { activeCampaignsCount: 0, totalResults: 0, cpr: 0, qualifiedLeads: 0 };
        return (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Активных кампаний: {cs.activeCampaignsCount}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-ordo-green" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{cs.totalResults.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 block">Результаты</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-ordo-green" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">${cs.cpr}</span>
                  <span className="text-xs text-gray-500 block">CPR</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-ordo-green" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{cs.qualifiedLeads.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 block">кЛиды</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Row 4 — Топ объявлений + Последние события */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Топ объявлений */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Топ объявлений</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Кампания</th>
                <th className="text-right pb-2 font-medium">Результаты</th>
                <th className="text-right pb-2 font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {data.topCampaigns.map((c, i) => (
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
              {data.topCampaigns.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400 text-sm">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Последние события</h3>
          <div className="flex flex-col gap-3">
            {data.recentEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${{
                  sale: 'bg-emerald-500',
                  lead: 'bg-blue-500',
                  campaign: 'bg-amber-500',
                }[event.type] ?? 'bg-amber-500'}`} />
                <span className="text-sm text-gray-700 flex-1 truncate">{event.text}</span>
                <span className="text-xs text-gray-400 shrink-0">{event.time}</span>
              </div>
            ))}
            {data.recentEvents.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">Нет событий</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
