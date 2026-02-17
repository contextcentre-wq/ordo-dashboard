import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { useQuery, useMutation } from 'convex/react';
import Members from '../../components/pages/Members';

const mockProject = {
  _id: 'project123' as any,
  _creationTime: Date.now(),
  name: 'Test Project',
  ownerId: 'owner1' as any,
  createdAt: Date.now(),
};

const mockUserId = 'user123' as any;

const mockMembers = [
  {
    _id: 'member1',
    phone: '+79991234567',
    email: 'owner@test.com',
    name: 'Владелец Иван',
    status: 'active',
    role: 'owner',
    invitedAt: 1700000000000,
    joinedAt: 1700001000000,
    userId: 'user123',
  },
  {
    _id: 'member2',
    phone: '+79998887766',
    email: 'admin@test.com',
    name: 'Админ Петр',
    status: 'active',
    role: 'admin',
    invitedAt: 1700100000000,
    joinedAt: 1700101000000,
    userId: 'user456',
  },
  {
    _id: 'member3',
    phone: '',
    email: 'invited@test.com',
    name: 'Приглашённый',
    status: 'invited',
    role: 'user',
    invitedAt: 1700200000000,
    joinedAt: null,
    userId: null,
  },
];

describe('Members', () => {
  let mockInviteFn: ReturnType<typeof vi.fn>;
  let mockUpdateRoleFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInviteFn = vi.fn();
    mockUpdateRoleFn = vi.fn();

    // useMutation is called on every render; use mockImplementation to return
    // the correct mock based on which mutation reference is passed
    vi.mocked(useMutation).mockImplementation((mutationRef: any) => {
      if (mutationRef === 'members:invite') return mockInviteFn;
      if (mutationRef === 'members:updateRole') return mockUpdateRoleFn;
      return vi.fn();
    });
  });

  it('shows loading state when query returns undefined', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    const { container } = render(<Members project={mockProject} userId={mockUserId} />);

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Участники')).toBeInTheDocument();
  });

  it('renders member list with roles and statuses', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    // Members display their phone/email
    expect(screen.getByText('+79991234567')).toBeInTheDocument();
    expect(screen.getByText('+79998887766')).toBeInTheDocument();
    // Member without phone shows email
    expect(screen.getByText('invited@test.com')).toBeInTheDocument();

    // Status labels
    const activeElements = screen.getAllByText('активен');
    expect(activeElements.length).toBe(2);
    expect(screen.getByText('приглашён')).toBeInTheDocument();
  });

  it('shows "вы" badge for current user', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    // The current user (userId matches member.userId) gets "вы" badge
    expect(screen.getByText('вы')).toBeInTheDocument();
  });

  it('renders page title and subtitle', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    expect(screen.getByText('Участники')).toBeInTheDocument();
    expect(screen.getByText('Управление участниками, их доступом и взаимодействиями')).toBeInTheDocument();
  });

  it('shows invite button', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    expect(screen.getByText('Пригласить')).toBeInTheDocument();
  });

  it('opens invite modal when invite button clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    await user.click(screen.getByText('Пригласить'));

    expect(screen.getByText('Пригласить участника')).toBeInTheDocument();
    expect(screen.getByText('Отправить приглашение')).toBeInTheDocument();
  });

  it('calls invite mutation with email and role', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(mockMembers);
    mockInviteFn.mockResolvedValue(undefined);

    render(<Members project={mockProject} userId={mockUserId} />);

    // Open invite modal
    await user.click(screen.getByText('Пригласить'));

    // The invite modal has a placeholder "name@company.com" for its email input
    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'new@test.com');

    await user.click(screen.getByText('Отправить приглашение'));

    await waitFor(() => {
      expect(mockInviteFn).toHaveBeenCalledWith({
        projectId: 'project123',
        userId: 'user123',
        email: 'new@test.com',
        phone: undefined,
        role: 'user',
      });
    });
  });

  it('shows invite error on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(mockMembers);
    mockInviteFn.mockRejectedValue(new Error('Пользователь уже в проекте'));

    render(<Members project={mockProject} userId={mockUserId} />);

    await user.click(screen.getByText('Пригласить'));

    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'existing@test.com');
    await user.click(screen.getByText('Отправить приглашение'));

    await waitFor(() => {
      expect(screen.getByText('Пользователь уже в проекте')).toBeInTheDocument();
    });
  });

  it('renders role dropdown for each member', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    // Each member row has a role select with options
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(3); // One per member
  });

  it('calls updateRole mutation when role is changed', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(mockMembers);
    mockUpdateRoleFn.mockResolvedValue(undefined);

    render(<Members project={mockProject} userId={mockUserId} />);

    // Get the role select for the second member (admin)
    const selects = screen.getAllByRole('combobox');
    // Change the admin member's role to 'user'
    await user.selectOptions(selects[1], 'user');

    await waitFor(() => {
      expect(mockUpdateRoleFn).toHaveBeenCalledWith({
        memberId: 'member2',
        userId: 'user123',
        newRole: 'user',
      });
    });
  });

  it('handles empty member list', () => {
    vi.mocked(useQuery).mockReturnValue([]);

    render(<Members project={mockProject} userId={mockUserId} />);

    expect(screen.getByText('Участники не найдены')).toBeInTheDocument();
  });

  it('renders search input', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    expect(screen.getByPlaceholderText('Поиск..')).toBeInTheDocument();
  });

  it('filters members by search query', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    const searchInput = screen.getByPlaceholderText('Поиск..');
    await user.type(searchInput, 'invited@test.com');

    // Only the invited member should be visible
    expect(screen.getByText('invited@test.com')).toBeInTheDocument();
    expect(screen.queryByText('+79991234567')).not.toBeInTheDocument();
  });

  it('shows table headers on desktop', () => {
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    expect(screen.getByText('Участник')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Дата регистрации')).toBeInTheDocument();
  });

  it('renders invite modal role selector with admin and user options', async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockReturnValue(mockMembers);

    render(<Members project={mockProject} userId={mockUserId} />);

    await user.click(screen.getByText('Пригласить'));

    // The invite modal has a role label "Роль"
    expect(screen.getByText('Роль')).toBeInTheDocument();

    // Check available options in the invite form
    const modal = screen.getByText('Пригласить участника').closest('div.bg-white');
    const roleSelect = modal!.querySelector('select') as HTMLSelectElement;
    expect(roleSelect).toBeTruthy();
    const options = roleSelect.querySelectorAll('option');
    const optionValues = Array.from(options).map(o => o.value);
    expect(optionValues).toContain('admin');
    expect(optionValues).toContain('user');
  });
});
