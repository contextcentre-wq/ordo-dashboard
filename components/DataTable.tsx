import React, { useState, useMemo, useCallback } from 'react';
import { TableRowData, LeadRecord, SaleRecord } from '../types';
import { ChevronDown, ChevronRight, X, Image, Search, Download } from 'lucide-react';
import DateRangePicker, { DateRange } from './DateRangePicker';
import { useIsMobile } from '../hooks/useIsMobile';

interface DataTableProps {
  data: TableRowData[];
  leadRecords?: LeadRecord[];
  saleRecords?: SaleRecord[];
}

type HierarchyTab = 'projects' | 'campaigns' | 'groups' | 'ads';
type CounterTab = 'leads' | 'qleads' | 'sales';
type ActiveTab = HierarchyTab | CounterTab;

const TAB_LABELS: Record<HierarchyTab, string> = {
  projects: 'Проекты',
  campaigns: 'Кампании',
  groups: 'Группы',
  ads: 'Объявления',
};

// Row enriched with parent hierarchy names for flat views
interface EnrichedRow extends TableRowData {
  parentProjectName?: string;
  parentCampaignName?: string;
  parentGroupName?: string;
}

// Shared header cell class
const TH_CLS = 'px-4 h-11 font-semibold text-xs text-gray-400 text-left whitespace-nowrap';

// Truncated cell helper
const TruncCell: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className = '' }) => (
  <div className={`w-32 flex flex-nowrap gap-2 items-center ${className}`} title={title || undefined}>
    <span className="line-clamp-1 text-ellipsis tracking-tighter">{children}</span>
  </div>
);

// Status dot
const StatusDot: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
);

// Format a CRM date like "16 February, 2026" + "17:07 (:00)"
const formatCrmDate = (iso: string): { date: string; time: string } => {
  const d = new Date(iso);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateStr = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const timeStr = `${h}:${m} (:00)`;
  return { date: dateStr, time: timeStr };
};

const DataTable: React.FC<DataTableProps> = ({ data, leadRecords = [], saleRecords = [] }) => {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2025, 8, 1),
    end: new Date(2025, 8, 30),
  });
  const [crmSearchQuery, setCrmSearchQuery] = useState('');

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (val: number) => {
    if (val === 0) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  // --- Flatten with parent info ---

  const collectByTypeEnriched = useCallback((
    items: TableRowData[],
    type: TableRowData['type'],
    parentProject?: string,
    parentCampaign?: string,
    parentGroup?: string,
  ): EnrichedRow[] => {
    const result: EnrichedRow[] = [];
    const traverse = (rows: TableRowData[], pProject?: string, pCampaign?: string, pGroup?: string) => {
      for (const row of rows) {
        const curProject = row.type === 'project' ? row.name : pProject;
        const curCampaign = row.type === 'campaign' ? row.name : pCampaign;
        const curGroup = row.type === 'group' ? row.name : pGroup;

        if (row.type === type) {
          result.push({
            ...row,
            parentProjectName: pProject,
            parentCampaignName: pCampaign,
            parentGroupName: pGroup,
          });
        }
        if (row.children) traverse(row.children, curProject, curCampaign, curGroup);
      }
    };
    traverse(items, parentProject, parentCampaign, parentGroup);
    return result;
  }, []);

  // Get the source items depending on selection
  const scopedSource = useMemo(() => {
    if (selectedIds.size === 0) return data;
    return data.filter(row => selectedIds.has(row.id));
  }, [data, selectedIds]);

  const isHierarchyTab = (tab: ActiveTab): tab is HierarchyTab =>
    ['projects', 'campaigns', 'groups', 'ads'].includes(tab);

  const isCounterTab = (tab: ActiveTab): tab is CounterTab =>
    ['leads', 'qleads', 'sales'].includes(tab);

  const effectiveHierarchyTab: HierarchyTab =
    isHierarchyTab(activeTab) ? activeTab : 'projects';

  // Rows visible in the table based on activeTab
  const visibleRows = useMemo((): EnrichedRow[] => {
    switch (effectiveHierarchyTab) {
      case 'projects':
        return data.map(r => ({ ...r }));
      case 'campaigns':
        return collectByTypeEnriched(scopedSource, 'campaign');
      case 'groups':
        return collectByTypeEnriched(scopedSource, 'group');
      case 'ads':
        return collectByTypeEnriched(scopedSource, 'ad');
      default:
        return data.map(r => ({ ...r }));
    }
  }, [effectiveHierarchyTab, data, scopedSource, collectByTypeEnriched]);

  // --- Cascading counters ---

  const allCampaigns = useMemo(() => collectByTypeEnriched(scopedSource, 'campaign'), [scopedSource, collectByTypeEnriched]);
  const allGroups = useMemo(() => collectByTypeEnriched(scopedSource, 'group'), [scopedSource, collectByTypeEnriched]);
  const allAds = useMemo(() => collectByTypeEnriched(scopedSource, 'ad'), [scopedSource, collectByTypeEnriched]);

  const counters: Record<HierarchyTab, number> = {
    projects: selectedIds.size,
    campaigns: allCampaigns.length,
    groups: allGroups.length,
    ads: allAds.length,
  };

  // --- Right-side counters ---

  const sumField = useCallback((rows: EnrichedRow[], field: 'leads' | 'qLeads' | 'sales'): number => {
    return rows.reduce((sum, row) => sum + (row[field] as number), 0);
  }, []);

  const totalLeads = useMemo(() => sumField(visibleRows, 'leads'), [visibleRows, sumField]);
  const totalQLeads = useMemo(() => sumField(visibleRows, 'qLeads'), [visibleRows, sumField]);
  const totalSales = useMemo(() => sumField(visibleRows, 'sales'), [visibleRows, sumField]);

  // --- Selection ---

  const handleTabChange = (tab: ActiveTab) => {
    if (isHierarchyTab(tab) && tab !== activeTab) {
      setSelectedIds(new Set());
      setExpandedRows({});
    }
    setActiveTab(tab);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allVisibleIds = visibleRows.map(r => r.id);
    const allSelected = allVisibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every(r => selectedIds.has(r.id));

  // --- Bar helpers (sum-based max like reference) ---

  const sumValue = (field: keyof TableRowData) => {
    let sum = 0;
    visibleRows.forEach(item => {
      if (typeof item[field] === 'number') {
        sum += item[field] as number;
      }
    });
    return sum || 1;
  };

  const sumResults = sumValue('results');
  const sumLeads = sumValue('leads');
  const sumQLeads = sumValue('qLeads');
  const sumSalesVal = sumValue('sales');

  const renderBar = (value: number, total: number) => {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm font-mono text-gray-900 shrink-0">{value}</span>
        <div className="w-full bg-gray-300/50 h-3 rounded-full overflow-hidden">
          <div
            className="bg-ordo-green h-full rounded-full transition-transform duration-500"
            style={{ transform: `translateX(-${100 - pct}%)` }}
          />
        </div>
      </div>
    );
  };

  // --- Column definitions per tab ---
  const showAdId = effectiveHierarchyTab === 'ads';
  const showCreo = effectiveHierarchyTab === 'ads';

  const nameColumnLabel = effectiveHierarchyTab === 'ads' ? 'Крео' : TAB_LABELS[effectiveHierarchyTab];

  // Parent columns to show (between name and account)
  const parentColumns = useMemo((): { key: string; label: string }[] => {
    switch (effectiveHierarchyTab) {
      case 'campaigns': return [{ key: 'parentProject', label: 'Проект' }];
      case 'groups': return [
        { key: 'parentCampaign', label: 'Кампания' },
        { key: 'parentProject', label: 'Проект' },
      ];
      case 'ads': return [
        { key: 'parentGroup', label: 'Группа' },
        { key: 'parentCampaign', label: 'Кампания' },
        { key: 'parentProject', label: 'Проект' },
      ];
      default: return [];
    }
  }, [effectiveHierarchyTab]);

  // --- CRM Table rendering ---

  const renderCrmTable = () => {
    const isSalesTab = activeTab === 'sales';
    const allRecords: (LeadRecord | SaleRecord)[] = isSalesTab ? saleRecords : leadRecords;
    const records = crmSearchQuery
      ? allRecords.filter(r => r.phone.includes(crmSearchQuery))
      : allRecords;

    const totalCols = isSalesTab ? 21 : 19;

    if (isMobile) {
      return (
        <div className="p-4 space-y-3">
          {records.map(record => {
            const isExpanded = expandedCards[record.id];
            return (
              <div key={record.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{record.phone}</span>
                  <span className="text-xs text-gray-600">{record.status}</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">{record.creationDate} &middot; {record.contactType}</div>
                <div className="text-sm text-gray-700">{record.deal}</div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Тип лида</span><span className="text-xs text-gray-700">{record.leadType}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Бюджет</span><span className="text-xs font-mono text-gray-700">{formatCurrency(record.budget)}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Pipeline</span><span className="text-xs text-gray-700">{record.pipeline}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Проект</span><span className="text-xs text-gray-700">{record.project}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Кампания</span><span className="text-xs text-gray-700">{record.campaign}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Группа</span><span className="text-xs text-gray-700">{record.group}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Ответственный</span><span className="text-xs text-gray-700">{record.responsible}</span></div>
                    {isSalesTab && 'saleDate' in record && (
                      <>
                        <div className="flex justify-between"><span className="text-xs text-gray-400">Дата продажи</span><span className="text-xs text-gray-700">{(record as SaleRecord).saleDate}</span></div>
                        <div className="flex justify-between"><span className="text-xs text-gray-400">Цикл сделки</span><span className="text-xs text-gray-700">{(record as SaleRecord).dealCycle}</span></div>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => toggleCard(record.id)}
                  className="mt-3 w-full text-center text-xs font-medium text-ordo-darkGreen min-h-[44px] flex items-center justify-center"
                >
                  {isExpanded ? 'Свернуть' : 'Подробнее'}
                </button>
              </div>
            );
          })}
          {records.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">Нет данных</div>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto overflow-y-hidden grow">
          <table className="min-w-full">
            <thead className="sticky top-0 z-20 bg-white">
              <tr className="border-b border-gray-200 text-left">
                <th className={`${TH_CLS} sticky left-0 z-20 bg-white shadow-[inset_-1px_0_0_0_#00000021]`}>Дата</th>
                {isSalesTab && (
                  <>
                    <th className={TH_CLS}>Дата продажи</th>
                    <th className={TH_CLS}>Цикл сделки</th>
                  </>
                )}
                <th className={TH_CLS}>Телефон</th>
                <th className={TH_CLS}>Тип контакта</th>
                <th className={TH_CLS}>Сделка</th>
                <th className={TH_CLS}>Тип лида</th>
                <th className={TH_CLS}>Бюджет</th>
                <th className={TH_CLS}>Статус</th>
                <th className={TH_CLS}>Pipeline</th>
                <th className={TH_CLS}>Объявление</th>
                <th className={TH_CLS}>Креатив</th>
                <th className={TH_CLS}>Проект</th>
                <th className={TH_CLS}>Кампания</th>
                <th className={TH_CLS}>Группа</th>
                <th className={TH_CLS}>Ответственный</th>
                <th className={TH_CLS}>UTM Source</th>
                <th className={TH_CLS}>UTM Medium</th>
                <th className={TH_CLS}>UTM Campaign</th>
                <th className={TH_CLS}>UTM Content</th>
                <th className={TH_CLS}>UTM Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(record => {
                const { date, time } = formatCrmDate(record.creationDate);
                return (
                  <tr key={record.id} className="hover:bg-gray-50 bg-white" style={{ height: '44px' }}>
                    {/* Creation date — sticky */}
                    <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 z-20 bg-white shadow-[inset_-1px_0_0_0_#00000021]">
                      <div className="w-32">
                        <div className="text-sm text-gray-900">{date}</div>
                        <div className="text-xs text-gray-400">{time}</div>
                      </div>
                    </td>
                    {/* Sale date + Deal cycle (positions 2-3 for Sales) */}
                    {isSalesTab && 'saleDate' in record && (
                      <>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">
                          <TruncCell title={(record as SaleRecord).saleDate}>{(record as SaleRecord).saleDate}</TruncCell>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-600">
                          <TruncCell title={(record as SaleRecord).dealCycle}>{(record as SaleRecord).dealCycle}</TruncCell>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.phone}><span className="font-mono text-sm text-gray-900">{record.phone}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.contactType}><span className="text-sm text-gray-600">{record.contactType}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.deal}><span className="text-sm text-gray-900">{record.deal}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.leadType}><span className="text-sm text-gray-600">{record.leadType}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={String(record.budget)}><span className="text-sm font-mono text-gray-900">{formatCurrency(record.budget)}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.status}><span className="text-sm text-gray-600">{record.status}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.pipeline}><span className="text-sm text-gray-600">{record.pipeline}</span></TruncCell>
                    </td>
                    {/* Ad — with green dot */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="w-32 flex flex-nowrap gap-2 items-center" title={record.ad}>
                        <StatusDot active={true} />
                        <span className="line-clamp-1 text-ellipsis tracking-tighter text-sm text-gray-600">{record.ad}</span>
                      </div>
                    </td>
                    {/* Creative — plain text for now */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.creative}><span className="text-sm text-gray-600">{record.creative}</span></TruncCell>
                    </td>
                    {/* Project — with dot (no color = inactive) */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="w-32 flex flex-nowrap gap-2 items-center" title={record.project}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300" />
                        <span className="line-clamp-1 text-ellipsis tracking-tighter text-sm text-gray-600">{record.project}</span>
                      </div>
                    </td>
                    {/* Campaign — with green dot */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="w-32 flex flex-nowrap gap-2 items-center" title={record.campaign}>
                        <StatusDot active={true} />
                        <span className="line-clamp-1 text-ellipsis tracking-tighter text-sm text-gray-600">{record.campaign}</span>
                      </div>
                    </td>
                    {/* Group — with green dot */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="w-32 flex flex-nowrap gap-2 items-center" title={record.group}>
                        <StatusDot active={true} />
                        <span className="line-clamp-1 text-ellipsis tracking-tighter text-sm text-gray-600">{record.group}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.responsible}><span className="text-sm text-gray-600">{record.responsible}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.utmSource}><span className="text-sm font-mono text-gray-400">{record.utmSource || '--'}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.utmMedium}><span className="text-sm font-mono text-gray-400">{record.utmMedium || '--'}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.utmCampaign}><span className="text-sm font-mono text-gray-400">{record.utmCampaign || '--'}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.utmContent}><span className="text-sm font-mono text-gray-400">{record.utmContent || '--'}</span></TruncCell>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <TruncCell title={record.utmTerm}><span className="text-sm font-mono text-gray-400">{record.utmTerm || '--'}</span></TruncCell>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={totalCols} className="text-center text-gray-400 py-8 text-sm">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Total / Found */}
        <div className="flex flex-wrap gap-6 items-center px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <p>Total: {allRecords.length}</p>
          <p>Found: {records.length}</p>
        </div>
      </>
    );
  };

  // --- Mobile card rendering ---

  const renderMobileCard = (row: EnrichedRow) => {
    const isCardExpanded = expandedCards[row.id];
    const isSelected = selectedIds.has(row.id);
    const roasBgColor = row.roas >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    return (
      <div key={row.id} className={`border border-gray-100 rounded-xl p-4 ${isSelected ? 'bg-green-50/50 border-green-200' : 'bg-white'}`}>
        {/* Card header */}
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(row.id)}
            className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green shrink-0"
          />
          <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{row.name}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${roasBgColor}`}>
            {row.roas}%
          </span>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-medium">Расходы</div>
            <div className="text-sm font-mono font-semibold text-gray-900">{formatCurrency(row.expenses)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-medium">Доходы</div>
            <div className="text-sm font-mono font-semibold text-gray-900">{formatCurrency(row.income)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-medium">ROAS</div>
            <div className="text-sm font-mono font-bold text-gray-900">{row.roas}%</div>
          </div>
        </div>

        {/* Expandable details */}
        {isCardExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Охваты</span>
                <span className="text-xs font-mono text-gray-900">{formatNumber(row.reach)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Показы</span>
                <span className="text-xs font-mono text-gray-900">{formatNumber(row.impressions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">CPM</span>
                <span className="text-xs font-mono text-gray-900">{formatCurrency(row.cpm)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Клики</span>
                <span className="text-xs font-mono text-gray-900">{formatNumber(row.clicks)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">CTR</span>
                <span className="text-xs font-mono text-gray-900">{row.ctr}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">CPC</span>
                <span className="text-xs font-mono text-gray-900">{formatCurrency(row.cpc)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {([
                { label: 'Результаты', value: row.results, cost: row.cpr, costLabel: 'CPR', max: sumResults },
                { label: 'Лиды', value: row.leads, cost: row.cpl, costLabel: 'CPL', max: sumLeads },
                { label: 'кЛиды', value: row.qLeads, cost: row.cpql, costLabel: 'CPqL', max: sumQLeads },
                { label: 'Продажи', value: row.sales, cost: row.cps, costLabel: 'CPS', max: sumSalesVal },
              ] as const).map(m => {
                const pct = m.max > 0 ? Math.max((m.value / m.max) * 100, 3) : 3;
                return (
                  <div key={m.label}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-gray-400">{m.label}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-900">{formatNumber(m.value)}</span>
                        <span className="text-[10px] font-mono text-gray-400">{m.costLabel} {formatCurrency(m.cost)}</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-300/50 rounded-full overflow-hidden">
                      <div className="h-full bg-ordo-green rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {row.adId && (
              <div className="flex justify-between pt-1">
                <span className="text-xs text-gray-400">AD ID</span>
                <span className="text-xs font-mono text-gray-400">{row.adId}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => toggleCard(row.id)}
          className="mt-3 w-full text-center text-xs font-medium text-ordo-darkGreen min-h-[44px] flex items-center justify-center"
        >
          {isCardExpanded ? 'Свернуть' : 'Подробнее'}
        </button>
      </div>
    );
  };

  // --- Render row (desktop) ---

  const renderRow = (row: EnrichedRow, depth = 0) => {
    const isExpanded = expandedRows[row.id];
    const hasChildren = row.children && row.children.length > 0;
    const isSelected = selectedIds.has(row.id);
    const showExpand = effectiveHierarchyTab === 'projects' && hasChildren;

    return (
      <React.Fragment key={row.id}>
        <tr className={`hover:bg-gray-50 group border-b border-gray-100 ${depth > 0 ? 'bg-gray-50/50' : 'bg-white'} ${isSelected ? 'bg-green-50/50' : ''}`}>
          {/* Checkbox */}
          <td className="px-4 py-2.5 whitespace-nowrap w-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(row.id)}
              className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green"
            />
          </td>

          {/* Name column — sticky */}
          <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 bg-white z-20 shadow-[inset_-1px_0_0_0_#00000021]">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
              {showExpand && (
                <button onClick={() => toggleRow(row.id)} className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              {showCreo && (
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded mr-3 flex items-center justify-center shrink-0">
                  <Image className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="w-32 flex flex-nowrap gap-2 items-center" title={row.name}>
                <StatusDot active={row.isActive} />
                <span className={`line-clamp-1 text-ellipsis tracking-tighter text-sm font-medium ${depth > 0 ? 'text-gray-500' : 'text-gray-900'}`}>{row.name}</span>
              </div>
            </div>
          </td>

          {/* Parent hierarchy columns */}
          {parentColumns.map(col => {
            const val = (row as any)[col.key + 'Name'] || '—';
            return (
              <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                <div className="w-32 flex flex-nowrap gap-2 items-center" title={val}>
                  <StatusDot active={true} />
                  <span className="line-clamp-1 text-ellipsis tracking-tighter text-sm text-gray-500">{val}</span>
                </div>
              </td>
            );
          })}

          {/* Account — green dot + name */}
          <td className="px-4 py-2.5 whitespace-nowrap">
            <div className="w-32 flex flex-nowrap gap-2 items-center" title={row.account}>
              <StatusDot active={row.isActive} />
              <span className="line-clamp-1 text-ellipsis tracking-tighter text-sm text-gray-600">{row.account}</span>
            </div>
          </td>

          {/* Metric columns */}
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.expenses)}</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.income)}</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{row.roas}%</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.reach)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.impressions)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.cpm)}</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.clicks)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{row.ctr}%</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.cpc)}</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap">{renderBar(row.results, sumResults)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.cpr)}</div></td>

          {/* Leads / CPL — always shown */}
          <td className="px-4 py-2.5 whitespace-nowrap">{renderBar(row.leads, sumLeads)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.cpl)}</div></td>

          <td className="px-4 py-2.5 whitespace-nowrap">{renderBar(row.qLeads, sumQLeads)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.cpql)}</div></td>
          <td className="px-4 py-2.5 whitespace-nowrap">{renderBar(row.sales, sumSalesVal)}</td>
          <td className="px-4 py-2.5 whitespace-nowrap"><div className="w-16 line-clamp-1 text-ellipsis tracking-tighter text-sm font-mono text-gray-900">{formatCurrency(row.cps)}</div></td>

          {/* AD ID */}
          {showAdId && (
            <td className="px-4 py-2.5 whitespace-nowrap text-sm font-mono text-gray-400">{row.adId || '—'}</td>
          )}
        </tr>
        {showExpand && isExpanded && row.children?.map(child => renderRow(child as EnrichedRow, depth + 1))}
      </React.Fragment>
    );
  };

  // --- Tab button rendering ---

  const renderHierarchyTab = (tab: HierarchyTab) => {
    const isActive = activeTab === tab;
    const count = counters[tab];
    const showBadge = count > 0;

    return (
      <button
        key={tab}
        onClick={() => handleTabChange(tab)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
          isActive
            ? 'bg-ordo-lightGreen text-ordo-darkGreen'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>{TAB_LABELS[tab]}</span>
        {showBadge && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
            isActive ? 'bg-ordo-darkGreen text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {count}
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="hover:text-red-200 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        )}
      </button>
    );
  };

  const renderCounterTab = (tab: CounterTab, label: string, value: number) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        onClick={() => handleTabChange(tab)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
          isActive
            ? 'bg-ordo-lightGreen text-ordo-darkGreen'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>{label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-ordo-darkGreen text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {formatNumber(value)}
        </span>
      </button>
    );
  };

  return (
    <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
      {/* Controls & Tabs */}
      <div className="p-4 border-b border-gray-100 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {(['projects', 'campaigns', 'groups', 'ads'] as HierarchyTab[]).map(renderHierarchyTab)}
            {renderCounterTab('leads', 'Лиды', totalLeads)}
            {renderCounterTab('qleads', 'кЛиды', totalQLeads)}
            {renderCounterTab('sales', 'Продажи', totalSales)}
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {isCounterTab(activeTab) ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={crmSearchQuery}
                  onChange={(e) => setCrmSearchQuery(e.target.value)}
                  placeholder="Введите номер телефона...."
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green transition-all w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ordo-lightGreen text-ordo-green text-sm font-medium hover:bg-ordo-green/20 transition-colors">
                <Download className="w-4 h-4" />
                Экспорт
              </button>
            </div>
          ) : (
            <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Сбросить фильтры</button>
          )}
        </div>
      </div>

      {/* Content: CRM table for counter tabs, metric table for hierarchy tabs */}
      {isCounterTab(activeTab) ? (
        renderCrmTable()
      ) : isMobile ? (
        <div className="p-4 space-y-3">
          {visibleRows.map(row => renderMobileCard(row))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto overflow-y-hidden grow">
            <table className="min-w-full">
              <thead className="sticky top-0 z-20 bg-white">
                <tr className="border-b border-gray-200 text-left">
                  <th className={`${TH_CLS} w-10`}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green"
                    />
                  </th>
                  <th className={`${TH_CLS} sticky left-0 bg-white z-20 shadow-[inset_-1px_0_0_0_#00000021]`}>{nameColumnLabel}</th>

                  {/* Parent hierarchy headers */}
                  {parentColumns.map(col => (
                    <th key={col.key} className={TH_CLS}>{col.label}</th>
                  ))}

                  <th className={TH_CLS}>Аккаунт</th>
                  <th className={TH_CLS}>Расходы</th>
                  <th className={TH_CLS}>Доходы</th>
                  <th className={TH_CLS}>ROAS</th>
                  <th className={TH_CLS}>Охваты</th>
                  <th className={TH_CLS}>Показы</th>
                  <th className={TH_CLS}>CPM</th>
                  <th className={TH_CLS}>Клики</th>
                  <th className={TH_CLS}>CTR</th>
                  <th className={TH_CLS}>CPC</th>
                  <th className={TH_CLS}>Результаты</th>
                  <th className={TH_CLS}>CPR</th>
                  <th className={TH_CLS}>Лиды</th>
                  <th className={TH_CLS}>CPL</th>
                  <th className={TH_CLS}>кЛиды</th>
                  <th className={TH_CLS}>CPqL</th>
                  <th className={TH_CLS}>Продажи</th>
                  <th className={TH_CLS}>CPS</th>

                  {showAdId && (
                    <th className={TH_CLS}>AD ID</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRows.map(row => renderRow(row))}
              </tbody>
            </table>
          </div>

          {/* Footer: Total / Found */}
          <div className="flex flex-wrap gap-6 items-center px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <p>Total: {visibleRows.length}</p>
            <p>Found: {visibleRows.length}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default DataTable;
