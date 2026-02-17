import React from 'react';
import Header from '../Header';
import FunnelChart from '../widgets/FunnelChart';
import IncomeExpenseWidget from '../widgets/IncomeExpenseWidget';
import RoasGauge from '../widgets/RomiGauge';
import KpiGrid from '../KpiGrid';
import DataTable from '../DataTable';
import { FunnelStage, Metric, TableRowData, LeadRecord, SaleRecord } from '../../types';

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

const tableData: TableRowData[] = [
  {
    id: 'p1',
    name: 'Facebook Ads',
    type: 'project',
    isActive: true,
    expenses: 6629.09,
    income: 21557.49,
    roas: 225.2,
    reach: 1562998,
    impressions: 1774804,
    cpm: 3.74,
    clicks: 15156,
    ctr: 0.85,
    cpc: 0.44,
    results: 1834,
    cpr: 3.61,
    leads: 1254,
    cpl: 5.29,
    qLeads: 414,
    cpql: 16.01,
    sales: 107,
    cps: 61.95,
    aov: 201.47,
    children: [
      {
        id: 'c1',
        name: 'Remarketing Campaign Q3',
        type: 'campaign',
        isActive: true,
        expenses: 1200.50,
        income: 5400.00,
        roas: 349.8,
        reach: 45000,
        impressions: 98000,
        cpm: 12.25,
        clicks: 3200,
        ctr: 3.2,
        cpc: 0.38,
        results: 400,
        cpr: 3.00,
        leads: 300,
        cpl: 4.00,
        qLeads: 100,
        cpql: 12.00,
        sales: 30,
        cps: 40.02,
        aov: 180.00,
        children: [
          {
            id: 'g1',
            name: 'Ретаргетинг — посетители сайта',
            type: 'group',
            isActive: true,
            expenses: 700.30,
            income: 3200.00,
            roas: 356.8,
            reach: 28000,
            impressions: 60000,
            cpm: 11.67,
            clicks: 2000,
            ctr: 3.3,
            cpc: 0.35,
            results: 250,
            cpr: 2.80,
            leads: 190,
            cpl: 3.69,
            qLeads: 65,
            cpql: 10.77,
            sales: 20,
            cps: 35.02,
            aov: 160.00,
            children: [
              {
                id: 'a1',
                name: 'Баннер 1080x1080 — скидка 20%',
                type: 'ad',
                isActive: true,
                expenses: 400.00,
                income: 1900.00,
                roas: 375.0,
                reach: 16000,
                impressions: 35000,
                cpm: 11.43,
                clicks: 1200,
                ctr: 3.4,
                cpc: 0.33,
                results: 150,
                cpr: 2.67,
                leads: 115,
                cpl: 3.48,
                qLeads: 40,
                cpql: 10.00,
                sales: 12,
                cps: 33.33,
                aov: 158.33,
                adId: '120211048752310195'
              },
              {
                id: 'a2',
                name: 'Видео 15с — отзывы клиентов',
                type: 'ad',
                isActive: true,
                expenses: 300.30,
                income: 1300.00,
                roas: 332.9,
                reach: 12000,
                impressions: 25000,
                cpm: 12.01,
                clicks: 800,
                ctr: 3.2,
                cpc: 0.38,
                results: 100,
                cpr: 3.00,
                leads: 75,
                cpl: 4.00,
                qLeads: 25,
                cpql: 12.01,
                sales: 8,
                cps: 37.54,
                aov: 162.50,
                adId: '120211048752310196'
              }
            ]
          },
          {
            id: 'g2',
            name: 'Ретаргетинг — брошенная корзина',
            type: 'group',
            isActive: true,
            expenses: 500.20,
            income: 2200.00,
            roas: 339.8,
            reach: 17000,
            impressions: 38000,
            cpm: 13.16,
            clicks: 1200,
            ctr: 3.2,
            cpc: 0.42,
            results: 150,
            cpr: 3.33,
            leads: 110,
            cpl: 4.55,
            qLeads: 35,
            cpql: 14.29,
            sales: 10,
            cps: 50.02,
            aov: 220.00,
            children: [
              {
                id: 'a3',
                name: 'Карусель — товары из корзины',
                type: 'ad',
                isActive: true,
                expenses: 500.20,
                income: 2200.00,
                roas: 339.8,
                reach: 17000,
                impressions: 38000,
                cpm: 13.16,
                clicks: 1200,
                ctr: 3.2,
                cpc: 0.42,
                results: 150,
                cpr: 3.33,
                leads: 110,
                cpl: 4.55,
                qLeads: 35,
                cpql: 14.29,
                sales: 10,
                cps: 50.02,
                aov: 220.00,
                adId: '120211048752310197'
              }
            ]
          }
        ]
      },
      {
        id: 'c2',
        name: 'Cold Traffic - Lookalike 1%',
        type: 'campaign',
        isActive: true,
        expenses: 5428.59,
        income: 16157.49,
        roas: 197.6,
        reach: 1517998,
        impressions: 1676804,
        cpm: 3.23,
        clicks: 11956,
        ctr: 0.71,
        cpc: 0.45,
        results: 1434,
        cpr: 3.78,
        leads: 954,
        cpl: 5.69,
        qLeads: 314,
        cpql: 17.28,
        sales: 77,
        cps: 70.50,
        aov: 209.83,
        children: [
          {
            id: 'g3',
            name: 'LAL 1% — покупатели 90д',
            type: 'group',
            isActive: true,
            expenses: 3200.00,
            income: 10500.00,
            roas: 228.1,
            reach: 900000,
            impressions: 1000000,
            cpm: 3.20,
            clicks: 7200,
            ctr: 0.72,
            cpc: 0.44,
            results: 870,
            cpr: 3.68,
            leads: 580,
            cpl: 5.52,
            qLeads: 190,
            cpql: 16.84,
            sales: 48,
            cps: 66.67,
            aov: 218.75,
            children: [
              {
                id: 'a4',
                name: 'Статика — оффер + CTA',
                type: 'ad',
                isActive: true,
                expenses: 1800.00,
                income: 6200.00,
                roas: 244.4,
                reach: 520000,
                impressions: 580000,
                cpm: 3.10,
                clicks: 4200,
                ctr: 0.72,
                cpc: 0.43,
                results: 510,
                cpr: 3.53,
                leads: 340,
                cpl: 5.29,
                qLeads: 112,
                cpql: 16.07,
                sales: 28,
                cps: 64.29,
                aov: 221.43,
                adId: '120211048752310198'
              },
              {
                id: 'a5',
                name: 'Видео 30с — демо продукта',
                type: 'ad',
                isActive: true,
                expenses: 1400.00,
                income: 4300.00,
                roas: 207.1,
                reach: 380000,
                impressions: 420000,
                cpm: 3.33,
                clicks: 3000,
                ctr: 0.71,
                cpc: 0.47,
                results: 360,
                cpr: 3.89,
                leads: 240,
                cpl: 5.83,
                qLeads: 78,
                cpql: 17.95,
                sales: 20,
                cps: 70.00,
                aov: 215.00,
                adId: '120211048752310199'
              }
            ]
          },
          {
            id: 'g4',
            name: 'LAL 1% — лиды CRM',
            type: 'group',
            isActive: true,
            expenses: 2228.59,
            income: 5657.49,
            roas: 153.9,
            reach: 617998,
            impressions: 676804,
            cpm: 3.29,
            clicks: 4756,
            ctr: 0.70,
            cpc: 0.47,
            results: 564,
            cpr: 3.95,
            leads: 374,
            cpl: 5.96,
            qLeads: 124,
            cpql: 17.97,
            sales: 29,
            cps: 76.85,
            aov: 195.09,
            children: [
              {
                id: 'a6',
                name: 'Баннер — социальное доказательство',
                type: 'ad',
                isActive: true,
                expenses: 2228.59,
                income: 5657.49,
                roas: 153.9,
                reach: 617998,
                impressions: 676804,
                cpm: 3.29,
                clicks: 4756,
                ctr: 0.70,
                cpc: 0.47,
                results: 564,
                cpr: 3.95,
                leads: 374,
                cpl: 5.96,
                qLeads: 124,
                cpql: 17.97,
                sales: 29,
                cps: 76.85,
                aov: 195.09,
                adId: '120211048752310200'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'p2',
    name: 'Google Ads',
    type: 'project',
    isActive: false,
    expenses: 1200.00,
    income: 800.00,
    roas: -33.3,
    reach: 50000,
    impressions: 60000,
    cpm: 20.00,
    clicks: 2000,
    ctr: 3.33,
    cpc: 0.60,
    results: 200,
    cpr: 6.00,
    leads: 100,
    cpl: 12.00,
    qLeads: 20,
    cpql: 60.00,
    sales: 5,
    cps: 240.00,
    aov: 160.00,
  }
];

const mockLeadRecords: LeadRecord[] = [
  {
    id: 'l1', creationDate: '2025-09-15', phone: '+7 701 234 5678', contactType: 'Звонок',
    deal: 'Консультация', leadType: 'Горячий', budget: 50000, status: 'Новый', pipeline: 'Основная',
    ad: 'Баннер 1080x1080', creative: 'Скидка 20%', project: 'Facebook Ads', campaign: 'Remarketing Q3',
    group: 'Ретаргетинг — посетители', responsible: 'Алексей П.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'remarketing_q3', utmContent: 'banner_1080', utmTerm: 'скидка',
  },
  {
    id: 'l2', creationDate: '2025-09-14', phone: '+7 702 345 6789', contactType: 'Форма',
    deal: 'Подписка Premium', leadType: 'Тёплый', budget: 120000, status: 'В работе', pipeline: 'Основная',
    ad: 'Видео 15с', creative: 'Отзывы клиентов', project: 'Facebook Ads', campaign: 'Cold Traffic LAL',
    group: 'LAL 1% — покупатели', responsible: 'Мария И.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'cold_lal1', utmContent: 'video_15s', utmTerm: 'отзывы',
  },
  {
    id: 'l3', creationDate: '2025-09-13', phone: '+7 705 456 7890', contactType: 'WhatsApp',
    deal: 'Настройка рекламы', leadType: 'Холодный', budget: 80000, status: 'Новый', pipeline: 'Основная',
    ad: 'Статика — оффер', creative: 'CTA баннер', project: 'Facebook Ads', campaign: 'Cold Traffic LAL',
    group: 'LAL 1% — лиды CRM', responsible: 'Дмитрий К.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'cold_lal1', utmContent: 'static_offer', utmTerm: 'настройка',
  },
  {
    id: 'l4', creationDate: '2025-09-12', phone: '+7 707 567 8901', contactType: 'Звонок',
    deal: 'Аудит рекламы', leadType: 'Горячий', budget: 30000, status: 'Завершён', pipeline: 'Быстрая',
    ad: 'Карусель', creative: 'Товары из корзины', project: 'Facebook Ads', campaign: 'Remarketing Q3',
    group: 'Ретаргетинг — корзина', responsible: 'Алексей П.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'remarketing_q3', utmContent: 'carousel', utmTerm: 'корзина',
  },
  {
    id: 'l5', creationDate: '2025-09-11', phone: '+7 700 678 9012', contactType: 'Форма',
    deal: 'Консультация', leadType: 'Тёплый', budget: 45000, status: 'В работе', pipeline: 'Основная',
    ad: 'Видео 30с', creative: 'Демо продукта', project: 'Facebook Ads', campaign: 'Cold Traffic LAL',
    group: 'LAL 1% — покупатели', responsible: 'Мария И.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'cold_lal1', utmContent: 'video_30s', utmTerm: 'демо',
  },
];

const mockSaleRecords: SaleRecord[] = [
  {
    id: 's1', creationDate: '2025-09-10', phone: '+7 701 234 5678', contactType: 'Звонок',
    deal: 'Консультация', leadType: 'Горячий', budget: 50000, status: 'Оплачен', pipeline: 'Основная',
    ad: 'Баннер 1080x1080', creative: 'Скидка 20%', project: 'Facebook Ads', campaign: 'Remarketing Q3',
    group: 'Ретаргетинг — посетители', responsible: 'Алексей П.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'remarketing_q3', utmContent: 'banner_1080', utmTerm: 'скидка',
    saleDate: '2025-09-18', dealCycle: '8 дней',
  },
  {
    id: 's2', creationDate: '2025-09-08', phone: '+7 707 567 8901', contactType: 'Звонок',
    deal: 'Аудит рекламы', leadType: 'Горячий', budget: 30000, status: 'Оплачен', pipeline: 'Быстрая',
    ad: 'Карусель', creative: 'Товары из корзины', project: 'Facebook Ads', campaign: 'Remarketing Q3',
    group: 'Ретаргетинг — корзина', responsible: 'Алексей П.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'remarketing_q3', utmContent: 'carousel', utmTerm: 'корзина',
    saleDate: '2025-09-20', dealCycle: '12 дней',
  },
  {
    id: 's3', creationDate: '2025-09-05', phone: '+7 702 345 6789', contactType: 'Форма',
    deal: 'Подписка Premium', leadType: 'Тёплый', budget: 120000, status: 'Оплачен', pipeline: 'Основная',
    ad: 'Видео 15с', creative: 'Отзывы клиентов', project: 'Facebook Ads', campaign: 'Cold Traffic LAL',
    group: 'LAL 1% — покупатели', responsible: 'Мария И.', utmSource: 'facebook', utmMedium: 'cpc',
    utmCampaign: 'cold_lal1', utmContent: 'video_15s', utmTerm: 'отзывы',
    saleDate: '2025-09-22', dealCycle: '17 дней',
  },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Header />
      {/* Top Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Funnel - Takes up 7 cols */}
        <div className="lg:col-span-7">
          <FunnelChart data={funnelData} />
        </div>

        {/* Right Column Widgets - Takes up 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6 h-full">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 md:gap-6 sm:h-[140px]">
              {/* Income/Expense - 3 cols */}
              <div className="sm:col-span-3">
                  <IncomeExpenseWidget income={21557.49} expense={6629.09} />
              </div>
              {/* ROAS - 2 cols */}
              <div className="sm:col-span-2">
                  <RoasGauge value={225.2} />
              </div>
          </div>

          {/* KPI Grid */}
          <div className="flex-1">
                <KpiGrid metrics={kpiMetrics} />
          </div>
        </div>
      </div>

      {/* Bottom Section - Data Table */}
      <DataTable data={tableData} leadRecords={mockLeadRecords} saleRecords={mockSaleRecords} />
    </div>
  );
};

export default Dashboard;
