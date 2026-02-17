import React, { useState, useMemo, useCallback } from 'react';
import { TableRowData, LeadRecord, SaleRecord } from '../types';
import { ChevronDown, ChevronRight, Filter, X, Image } from 'lucide-react';
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

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
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

  // --- Bar helpers ---

  const maxValue = (field: keyof TableRowData) => {
    let max = 0;
    visibleRows.forEach(item => {
      if (typeof item[field] === 'number' && (item[field] as number) > max) {
        max = item[field] as number;
      }
    });
    return max || 1;
  };

  const maxResults = maxValue('results');
  const maxLeads = maxValue('leads');
  const maxQLeads = maxValue('qLeads');
  const maxSales = maxValue('sales');

  const renderBar = (value: number, max: number) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-mono text-gray-900 w-12 text-right">{value}</span>
        <div className="h-2 rounded-full bg-ordo-darkGreen" style={{ width: `${Math.max(percentage, 5)}px`, maxWidth: '60px' }}></div>
      </div>
    );
  };

  const renderHeader = (label: string) => (
    <div className="flex items-center group cursor-pointer hover:text-gray-600">
      {label}
      <Filter className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  // --- Column definitions per tab ---
  const showLeadsCpl = effectiveHierarchyTab !== 'projects';
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
    const records: (LeadRecord | SaleRecord)[] = isSalesTab ? saleRecords : leadRecords;

    if (isMobile) {
      return (
        <div className="p-4 space-y-3">
          {records.map(record => {
            const isExpanded = expandedCards[record.id];
            return (
              <div key={record.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{record.phone}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    record.status === 'Новый' ? 'bg-blue-100 text-blue-700' :
                    record.status === 'В работе' ? 'bg-yellow-100 text-yellow-700' :
                    record.status === 'Оплачен' ? 'bg-green-100 text-green-700' :
                    record.status === 'Завершён' ? 'bg-gray-100 text-gray-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">{record.creationDate} &middot; {record.contactType}</div>
                <div className="text-sm text-gray-700">{record.deal}</div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Тип лида</span><span className="text-xs text-gray-700">{record.leadType}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-400">Бюджет</span><span className="text-xs font-mono text-gray-700">{formatNumber(record.budget)} &#8376;</span></div>
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
      <div className="overflow-x-auto overflow-y-hidden grow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Дата</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Телефон</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Тип контакта</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Сделка</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Тип лида</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Бюджет</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Статус</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Pipeline</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Объявление</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Креатив</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Проект</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Кампания</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Группа</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Ответственный</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">UTM Source</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">UTM Medium</th>
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">UTM Campaign</th>
              {isSalesTab && (
                <>
                  <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Дата продажи</th>
                  <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Цикл сделки</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-gray-50 bg-white">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{record.creationDate}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{record.phone}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.contactType}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{record.deal}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    record.leadType === 'Горячий' ? 'bg-red-100 text-red-700' :
                    record.leadType === 'Тёплый' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {record.leadType}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(record.budget)} &#8376;</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    record.status === 'Новый' ? 'bg-blue-100 text-blue-700' :
                    record.status === 'В работе' ? 'bg-yellow-100 text-yellow-700' :
                    record.status === 'Оплачен' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.pipeline}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.ad}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.creative}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.project}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.campaign}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.group}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.responsible}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-400">{record.utmSource}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-400">{record.utmMedium}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-400">{record.utmCampaign}</td>
                {isSalesTab && 'saleDate' in record && (
                  <>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{(record as SaleRecord).saleDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{(record as SaleRecord).dealCycle}</td>
                  </>
                )}
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={isSalesTab ? 19 : 17} className="text-center text-gray-400 py-8 text-sm">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
            {/* Text metrics */}
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

            {/* Bar metrics */}
            <div className="space-y-2">
              {([
                { label: 'Результаты', value: row.results, cost: row.cpr, costLabel: 'CPR', max: maxResults },
                { label: 'Лиды', value: row.leads, cost: row.cpl, costLabel: 'CPL', max: maxLeads },
                { label: 'кЛиды', value: row.qLeads, cost: row.cpql, costLabel: 'CPqL', max: maxQLeads },
                { label: 'Продажи', value: row.sales, cost: row.cps, costLabel: 'CPS', max: maxSales },
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
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-ordo-darkGreen rounded-full" style={{ width: `${pct}%` }} />
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

        {/* Toggle button */}
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
          <td className="px-4 py-4 whitespace-nowrap w-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(row.id)}
              className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green"
            />
          </td>

          {/* Name / Крео column */}
          <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none md:static">
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
              {row.type === 'project' && !showCreo && (
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded mr-3 flex items-center justify-center text-xs font-bold shrink-0">
                  {row.name.charAt(0)}
                </div>
              )}
              <span className={`text-sm font-medium ${depth > 0 ? 'text-gray-500' : 'text-gray-900'}`}>{row.name}</span>
            </div>
          </td>

          {/* Parent hierarchy columns */}
          {parentColumns.map(col => (
            <td key={col.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
              {(row as any)[col.key + 'Name'] || '—'}
            </td>
          ))}

          {/* Аккаунт */}
          <td className="px-4 py-4 whitespace-nowrap">
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
          </td>

          {/* Metric columns */}
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.expenses)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.income)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">{row.roas}%</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.reach)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.impressions)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpm)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.clicks)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{row.ctr}%</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpc)}</td>
          <td className="px-4 py-4 whitespace-nowrap">{renderBar(row.results, maxResults)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpr)}</td>

          {/* Лиды / CPL */}
          {showLeadsCpl && (
            <>
              <td className="px-4 py-4 whitespace-nowrap">{renderBar(row.leads, maxLeads)}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpl)}</td>
            </>
          )}

          <td className="px-4 py-4 whitespace-nowrap">{renderBar(row.qLeads, maxQLeads)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpql)}</td>
          <td className="px-4 py-4 whitespace-nowrap">{renderBar(row.sales, maxSales)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cps)}</td>

          {/* AD ID */}
          {showAdId && (
            <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{row.adId || '—'}</td>
          )}
        </tr>
        {showExpand && isExpanded && row.children?.map(child => renderRow(child as EnrichedRow, depth + 1))}
      </React.Fragment>
    );
  };

  // --- Tab button rendering ---

  const renderHierarchyTab = (tab: HierarchyTab) => {
    const isActive = activeTab === tab || (isHierarchyTab(activeTab) ? false : effectiveHierarchyTab === tab);
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
          <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Сбросить фильтры</button>
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
        <div className="overflow-x-auto overflow-y-hidden grow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider sticky left-0 bg-white z-10 md:static">{nameColumnLabel}</th>

                {/* Parent hierarchy headers */}
                {parentColumns.map(col => (
                  <th key={col.key} className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{col.label}</th>
                ))}

                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Аккаунт</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('Расходы')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('Доходы')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('ROAS')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('Охваты')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('Показы')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CPM')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('Клики')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CTR')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CPC')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Результаты</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CPR')}</th>

                {showLeadsCpl && (
                  <>
                    <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('Лиды')}</th>
                    <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CPL')}</th>
                  </>
                )}

                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('кЛиды')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CPqL')}</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">Продажи</th>
                <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('CPS')}</th>

                {showAdId && (
                  <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">AD ID</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleRows.map(row => renderRow(row))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataTable;
