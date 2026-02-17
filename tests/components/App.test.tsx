import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

// Provide a working localStorage mock for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

import { useQuery, useMutation } from 'convex/react';
import App from '../../App';

const mockProjects = [
  {
    _id: 'project1',
    _creationTime: Date.now(),
    name: 'Проект 1',
    ownerId: 'user123',
    createdAt: Date.now(),
  },
  {
    _id: 'project2',
    _creationTime: Date.now(),
    name: 'Проект 2',
    ownerId: 'user123',
    createdAt: Date.now() - 100000,
  },
];

const mockDashboardData = {
  funnel: [
    { label: 'Охват', value: 150000, displayValue: '150,000', conversionRate: 100 },
  ],
  kpis: [{ label: 'CPC', value: '$3.74' }],
  income: 500000,
  expense: 150000,
  roasValue: 233.3,
  topCampaigns: [],
  recentEvents: [],
  statCards: [{ label: 'Всего лидов', value: '150' }],
};

const clearLocalStorage = () => {
  localStorageMock.clear();
};

describe('App', () => {
  let mockCreateProjectFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearLocalStorage();
    mockCreateProjectFn = vi.fn();
  });

  afterEach(() => {
    clearLocalStorage();
  });

  it('renders login page when no userId in state', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    vi.mocked(useMutation).mockReturnValue(vi.fn());

    render(<App />);

    expect(screen.getByText('Войдите, чтобы продолжить работу')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
  });

  it('renders register page when switching from login', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(undefined);
    vi.mocked(useMutation).mockReturnValue(vi.fn());

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Регистрация' }));

    expect(screen.getByText('Создайте аккаунт и начните анализировать')).toBeInTheDocument();
  });

  it('shows loading state when projects are loading', () => {
    localStorage.setItem('ordo_userId', 'user123');
    vi.mocked(useQuery).mockReturnValue(undefined);
    vi.mocked(useMutation).mockReturnValue(vi.fn());

    render(<App />);

    expect(screen.getByText('Загрузка проектов...')).toBeInTheDocument();
  });

  it('shows project selection screen when projects loaded but none selected', () => {
    localStorage.setItem('ordo_userId', 'user123');

    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'projects:list') return mockProjects;
      return undefined;
    });
    vi.mocked(useMutation).mockReturnValue(mockCreateProjectFn);

    render(<App />);

    expect(screen.getByText('Выберите проект')).toBeInTheDocument();
    expect(screen.getByText('Проект 1')).toBeInTheDocument();
    expect(screen.getByText('Проект 2')).toBeInTheDocument();
  });

  it('navigates to dashboard after selecting a project', async () => {
    const user = userEvent.setup();
    localStorage.setItem('ordo_userId', 'user123');

    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'projects:list') return mockProjects;
      if (queryFn === 'dashboard:getDashboardSummary') return mockDashboardData;
      return undefined;
    });
    vi.mocked(useMutation).mockReturnValue(mockCreateProjectFn);

    render(<App />);

    // Click on first project
    await user.click(screen.getByText('Проект 1'));

    // Now we should see the dashboard content
    await waitFor(() => {
      expect(screen.getByText('Воронка')).toBeInTheDocument();
    });
  });

  it('renders project selection after login with stored userId', () => {
    localStorage.setItem('ordo_userId', 'user123');

    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'projects:list') return mockProjects;
      return undefined;
    });
    vi.mocked(useMutation).mockReturnValue(mockCreateProjectFn);

    render(<App />);

    // Should show project selection since no project is active yet
    expect(screen.getByText('Выберите проект')).toBeInTheDocument();
  });

  it('handles login flow and stores userId', async () => {
    const user = userEvent.setup();
    const mockLoginFn = vi.fn().mockResolvedValue({ _id: 'newUser123' });

    vi.mocked(useQuery).mockReturnValue(undefined);
    vi.mocked(useMutation).mockReturnValue(mockLoginFn);

    render(<App />);

    // We're on the login page
    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(localStorage.getItem('ordo_userId')).toBe('newUser123');
    });
  });

  it('project list loads from Convex query', () => {
    localStorage.setItem('ordo_userId', 'user123');

    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'projects:list') return mockProjects;
      return undefined;
    });
    vi.mocked(useMutation).mockReturnValue(mockCreateProjectFn);

    render(<App />);

    // Both projects visible in the selection screen
    expect(screen.getByText('Проект 1')).toBeInTheDocument();
    expect(screen.getByText('Проект 2')).toBeInTheDocument();
  });

  it('handles empty project list', () => {
    localStorage.setItem('ordo_userId', 'user123');

    vi.mocked(useQuery).mockImplementation((queryFn: any) => {
      if (queryFn === 'projects:list') return [];
      return undefined;
    });
    vi.mocked(useMutation).mockReturnValue(mockCreateProjectFn);

    render(<App />);

    // Should show project selection with create prompt
    expect(screen.getByText(/У вас пока нет проектов/)).toBeInTheDocument();
  });

  it('can switch between login and register views', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(undefined);
    vi.mocked(useMutation).mockReturnValue(vi.fn());

    render(<App />);

    // Start on login
    expect(screen.getByText('Войдите, чтобы продолжить работу')).toBeInTheDocument();

    // Switch to register
    await user.click(screen.getByRole('button', { name: 'Регистрация' }));
    expect(screen.getByText('Создайте аккаунт и начните анализировать')).toBeInTheDocument();

    // Switch back to login
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByText('Войдите, чтобы продолжить работу')).toBeInTheDocument();
  });
});
