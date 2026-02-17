import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(),
  ConvexProvider: ({ children }: any) => children,
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    auth: { login: 'auth:login', register: 'auth:register', getUser: 'auth:getUser' },
    projects: { list: 'projects:list', get: 'projects:get', create: 'projects:create', update: 'projects:update', remove: 'projects:remove' },
    members: { listByProject: 'members:listByProject', invite: 'members:invite', updateRole: 'members:updateRole' },
    dashboard: { getDashboardSummary: 'dashboard:getDashboardSummary' },
    analytics: { getHierarchicalData: 'analytics:getHierarchicalData' },
    leads: { listByProject: 'leads:listByProject' },
    sales: { listByProject: 'sales:listByProject' },
  },
}));

vi.mock('../../convex/_generated/dataModel', () => ({}));

// Mock useIsMobile to return false (desktop) by default
vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

import { useQuery } from 'convex/react';
import Dashboard from '../../components/pages/Dashboard';

const mockProject = {
  _id: 'project123' as any,
  _creationTime: Date.now(),
  name: 'Test Project',
  ownerId: 'owner1' as any,
  createdAt: Date.now(),
};

const mockDashboardData = {
  funnel: [
    { label: 'Охват', value: 150000, displayValue: '150,000', conversionRate: 100 },
    { label: 'Показы', value: 100000, displayValue: '100,000', conversionRate: 66.7 },
  ],
  kpis: [
    { label: 'CPC', value: '$3.74' },
    { label: 'CTR', value: '0.85%' },
  ],
  income: 500000,
  expense: 150000,
  roasValue: 233.3,
  topCampaigns: [
    { name: 'Campaign 1', results: 100, spend: 5000, roas: 150.0 },
    { name: 'Campaign 2', results: 250, spend: 8000, roas: 220.0 },
  ],
  recentEvents: [
    { type: 'lead', text: 'Новый лид: Иван +7***1234', time: '2 мин назад' },
    { type: 'sale', text: 'Продажа: Петр +7***5678', time: '10 мин назад' },
  ],
  statCards: [
    { label: 'Всего лидов', value: '150' },
    { label: 'Всего продаж', value: '45' },
    { label: 'Активных кампаний', value: '12' },
    { label: 'Конверсия', value: '30%' },
  ],
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when query returns undefined', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    const { container } = render(<Dashboard project={mockProject} />);

    // Loading skeleton has animate-pulse elements
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders project name in header when data is loading', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    render(<Dashboard project={mockProject} />);

    // Header renders project name (on desktop)
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders funnel chart when data loads', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    // Funnel chart renders with funnel labels
    expect(screen.getByText('Охват')).toBeInTheDocument();
    expect(screen.getByText('Показы')).toBeInTheDocument();
    // Funnel chart has title "Воронка"
    expect(screen.getByText('Воронка')).toBeInTheDocument();
  });

  it('renders KPI grid with correct values', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('CPC')).toBeInTheDocument();
    expect(screen.getByText('$3.74')).toBeInTheDocument();
    expect(screen.getByText('CTR')).toBeInTheDocument();
    expect(screen.getByText('0.85%')).toBeInTheDocument();
  });

  it('renders income/expense widget', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    // IncomeExpenseWidget shows "Доход/Расходы"
    expect(screen.getByText('Доход/Расходы')).toBeInTheDocument();
  });

  it('renders ROAS gauge', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    // RoasGauge shows ROAS label and value
    expect(screen.getByText('233.3%')).toBeInTheDocument();
  });

  it('renders stat cards with correct values', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('Всего лидов')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Всего продаж')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Активных кампаний')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Конверсия')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('renders top campaigns list', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('Топ кампании')).toBeInTheDocument();
    expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Campaign 2')).toBeInTheDocument();
    // Check ROAS values
    expect(screen.getByText('150%')).toBeInTheDocument();
    expect(screen.getByText('220%')).toBeInTheDocument();
  });

  it('renders recent events list', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('Последние события')).toBeInTheDocument();
    expect(screen.getByText('Новый лид: Иван +7***1234')).toBeInTheDocument();
    expect(screen.getByText('2 мин назад')).toBeInTheDocument();
    expect(screen.getByText('Продажа: Петр +7***5678')).toBeInTheDocument();
    expect(screen.getByText('10 мин назад')).toBeInTheDocument();
  });

  it('shows "Нет данных" for empty top campaigns', () => {
    const emptyData = {
      ...mockDashboardData,
      topCampaigns: [],
    };
    vi.mocked(useQuery).mockReturnValue(emptyData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });

  it('shows "Нет событий" for empty recent events', () => {
    const emptyData = {
      ...mockDashboardData,
      recentEvents: [],
    };
    vi.mocked(useQuery).mockReturnValue(emptyData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('Нет событий')).toBeInTheDocument();
  });

  it('handles empty stat cards gracefully', () => {
    const emptyData = {
      ...mockDashboardData,
      statCards: [],
    };
    vi.mocked(useQuery).mockReturnValue(emptyData);

    render(<Dashboard project={mockProject} />);

    // Should render without crashing; the campaign headers still show
    expect(screen.getByText('Топ кампании')).toBeInTheDocument();
  });

  it('renders campaign results correctly', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    // "100" appears in multiple places (funnel conversionRate and campaign results),
    // so use getAllByText; "250" is unique to campaigns
    expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('renders the table headers for top campaigns', () => {
    vi.mocked(useQuery).mockReturnValue(mockDashboardData);

    render(<Dashboard project={mockProject} />);

    expect(screen.getByText('Кампания')).toBeInTheDocument();
    expect(screen.getByText('Результаты')).toBeInTheDocument();
  });
});
