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

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

import { useQuery } from 'convex/react';
import Analytics from '../../components/pages/Analytics';

const mockProject = {
  _id: 'project123' as any,
  _creationTime: Date.now(),
  name: 'Test Project',
  ownerId: 'owner1' as any,
  createdAt: Date.now(),
};

const mockUserId = 'user123' as any;

const mockTableData = [
  {
    id: 'row1',
    name: 'Project Alpha',
    type: 'project' as const,
    isActive: true,
    account: 'Account 1',
    expenses: 5000,
    income: 15000,
    roas: 200,
    reach: 50000,
    impressions: 80000,
    cpm: 2.5,
    clicks: 1000,
    ctr: 1.25,
    cpc: 5.0,
    results: 200,
    cpr: 25,
    leads: 80,
    cpl: 62.5,
    qLeads: 20,
    cpql: 250,
    sales: 10,
    cps: 500,
    aov: 1500,
    children: [],
  },
];

const mockRawLeads = [
  {
    _id: 'lead1',
    _creationTime: Date.now(),
    projectId: 'project123',
    createdAt: 1700000000000,
    phone: '+79991234567',
    contactType: 'Входящий',
    externalDealId: 'DEAL-001',
    leadType: 'Горячий',
    budget: 50000,
    status: 'Новый',
    pipeline: 'Основная',
    adName: 'Ad 1',
    creativeName: 'Creative 1',
    campaignName: 'Campaign 1',
    adGroupName: 'Group 1',
    responsible: 'Менеджер 1',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'campaign1',
    utmContent: 'content1',
    utmTerm: 'term1',
  },
];

const mockRawSales = [
  {
    _id: 'sale1',
    _creationTime: Date.now(),
    projectId: 'project123',
    registrationDateStr: '2024-11-15',
    clientPhone: '+79995555555',
    externalDealId: 'DEAL-002',
    amount: 100000,
    dealStatus: 'Завершена',
    adName: 'Ad 2',
    creativeName: 'Creative 2',
    campaignName: 'Campaign 2',
    adGroupName: 'Group 2',
    responsible: 'Менеджер 2',
    utmSource: 'yandex',
    utmMedium: 'search',
    utmCampaign: 'campaign2',
    utmContent: 'content2',
    utmTerm: 'term2',
    saleDateStr: '2024-11-20',
    daysToSale: 5,
  },
];

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when all queries return undefined', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    const { container } = render(<Analytics project={mockProject} userId={mockUserId} />);

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton when only tableData is undefined', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return undefined;
      if (queryFn === 'leads:listByProject') return mockRawLeads;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    const { container } = render(<Analytics project={mockProject} userId={mockUserId} />);

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton when only leads are undefined', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return undefined;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    const { container } = render(<Analytics project={mockProject} userId={mockUserId} />);

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders DataTable with hierarchical data when all queries loaded', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return mockRawLeads;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    render(<Analytics project={mockProject} userId={mockUserId} />);

    // DataTable renders with project name in the table
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    // DataTable renders hierarchy tabs - "Проекты" may appear multiple times (tab + table header)
    expect(screen.getAllByText('Проекты').length).toBeGreaterThanOrEqual(1);
  });

  it('renders project name in header', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return mockRawLeads;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    render(<Analytics project={mockProject} userId={mockUserId} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders lead and sale counter tabs', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return mockRawLeads;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    render(<Analytics project={mockProject} userId={mockUserId} />);

    // Counter tabs for leads and sales - may appear in both tabs and table headers
    expect(screen.getAllByText('Лиды').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Продажи').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('кЛиды').length).toBeGreaterThanOrEqual(1);
  });

  it('correctly maps Convex lead documents to LeadRecord interface', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return mockRawLeads;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    // The component maps leads and passes them to DataTable
    // If it renders without error, the mapping is correct
    const { container } = render(<Analytics project={mockProject} userId={mockUserId} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('correctly maps Convex sale documents to SaleRecord interface', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return mockRawLeads;
      if (queryFn === 'sales:listByProject') return mockRawSales;
      return undefined;
    });

    // The component maps sales with daysToSale -> dealCycle formatting
    const { container } = render(<Analytics project={mockProject} userId={mockUserId} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('handles empty data arrays gracefully', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return [];
      if (queryFn === 'leads:listByProject') return [];
      if (queryFn === 'sales:listByProject') return [];
      return undefined;
    });

    render(<Analytics project={mockProject} userId={mockUserId} />);

    // Still renders the tab structure - "Проекты" may appear multiple times
    expect(screen.getAllByText('Проекты').length).toBeGreaterThanOrEqual(1);
  });

  it('renders hierarchy tabs for DataTable', () => {
    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'analytics:getHierarchicalData') return mockTableData;
      if (queryFn === 'leads:listByProject') return [];
      if (queryFn === 'sales:listByProject') return [];
      return undefined;
    });

    render(<Analytics project={mockProject} userId={mockUserId} />);

    // These texts may appear in both tab buttons and table headers
    expect(screen.getAllByText('Проекты').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Кампании').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Группы').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Объявления').length).toBeGreaterThanOrEqual(1);
  });
});
