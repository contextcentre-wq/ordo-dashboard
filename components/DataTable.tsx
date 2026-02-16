import React, { useState, useMemo, useCallback } from 'react';
import { TableRowData } from '../types';
import { ChevronDown, ChevronRight, Filter, X, Image } from 'lucide-react';
import DateRangePicker, { DateRange } from './DateRangePicker';

interface DataTableProps {
  data: TableRowData[];
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

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2025, 8, 1),  // 01.09.2025
    end: new Date(2025, 8, 30),   // 30.09.2025
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
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

  // Get the source items depending on selection — if projects are selected, scope down
  const scopedSource = useMemo(() => {
    if (selectedIds.size === 0) return data;
    return data.filter(row => selectedIds.has(row.id));
  }, [data, selectedIds]);

  const isHierarchyTab = (tab: ActiveTab): tab is HierarchyTab =>
    ['projects', 'campaigns', 'groups', 'ads'].includes(tab);

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
  // Projects: Проект, Аккаунт, Расходы..CPC, Результаты, CPR, кЛиды, CPqL, Продажи, CPS (NO Лиды/CPL)
  // Campaigns: Кампания, Проект, Аккаунт, ...full metrics + Лиды/CPL + CPS
  // Groups: Группа, Кампания, Проект, Аккаунт, ...full metrics + Лиды/CPL + CPS
  // Ads: Крео, Группа, Кампания, Проект, Аккаунт, ...full metrics + Лиды/CPL + CPS + AD ID

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

  // --- Render row ---

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
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">{row.romi}%</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.reach)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.impressions)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpm)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatNumber(row.clicks)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{row.ctr}%</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpc)}</td>
          <td className="px-4 py-4 whitespace-nowrap">{renderBar(row.results, maxResults)}</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{formatCurrency(row.cpr)}</td>

          {/* Лиды / CPL — only for campaigns, groups, ads */}
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

          {/* AD ID — only for ads */}
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
            ? 'bg-green-50 text-ordo-darkGreen'
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
            ? 'bg-green-50 text-ordo-darkGreen'
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
    <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
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

      {/* Table */}
      <div className="overflow-x-auto grow">
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
              <th className="px-4 py-3 font-medium text-xs text-gray-400 uppercase tracking-wider">{renderHeader('ROMI')}</th>
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
    </div>
  );
};

export default DataTable;
