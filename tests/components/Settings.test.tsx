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

import { useMutation } from 'convex/react';
import Settings from '../../components/pages/Settings';

const mockProject = {
  _id: 'project123' as any,
  _creationTime: Date.now(),
  name: 'Мой Проект',
  ownerId: 'owner1' as any,
  createdAt: Date.now(),
  crmProvider: undefined as string | undefined,
};

const mockUserId = 'user123' as any;
const mockOnDeleted = vi.fn();

describe('Settings', () => {
  let mockUpdateFn: ReturnType<typeof vi.fn>;
  let mockRemoveFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateFn = vi.fn();
    mockRemoveFn = vi.fn();

    // useMutation is called on every render; use mockImplementation to return
    // the correct mock based on which mutation reference is passed
    vi.mocked(useMutation).mockImplementation((mutationRef: any) => {
      if (mutationRef === 'projects:update') return mockUpdateFn;
      if (mutationRef === 'projects:remove') return mockRemoveFn;
      return vi.fn();
    });
  });

  it('renders project name input pre-filled', () => {
    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    const nameInput = screen.getByDisplayValue('Мой Проект');
    expect(nameInput).toBeInTheDocument();
  });

  it('renders page title and subtitle', () => {
    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('Настройки')).toBeInTheDocument();
    expect(screen.getByText('Основные настройки дашборда')).toBeInTheDocument();
  });

  it('renders section headers', () => {
    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('Основные')).toBeInTheDocument();
    expect(screen.getByText('Интеграция с CRM')).toBeInTheDocument();
  });

  it('renders CRM provider selector with options', () => {
    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('CRM система')).toBeInTheDocument();

    const crmSelect = screen.getByDisplayValue('Не выбрана');
    expect(crmSelect).toBeInTheDocument();

    // Check options
    const options = crmSelect.querySelectorAll('option');
    const values = Array.from(options).map(o => o.value);
    expect(values).toContain('');
    expect(values).toContain('amocrm');
    expect(values).toContain('bitrix24');
  });

  it('does not show webhook URL when no CRM provider selected', () => {
    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    expect(screen.queryByText('Webhook URL')).not.toBeInTheDocument();
  });

  it('shows webhook URL when CRM provider is selected', async () => {
    const user = userEvent.setup();

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    const crmSelect = screen.getByDisplayValue('Не выбрана');
    await user.selectOptions(crmSelect, 'amocrm');

    expect(screen.getByText('Webhook URL')).toBeInTheDocument();
    // Webhook URL should contain the project ID and provider
    const webhookInput = screen.getByDisplayValue(/amocrm\/project123/);
    expect(webhookInput).toBeInTheDocument();
  });

  it('shows webhook URL for bitrix24', async () => {
    const user = userEvent.setup();

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    const crmSelect = screen.getByDisplayValue('Не выбрана');
    await user.selectOptions(crmSelect, 'bitrix24');

    const webhookInput = screen.getByDisplayValue(/bitrix24\/project123/);
    expect(webhookInput).toBeInTheDocument();
  });

  it('save button calls update mutation', async () => {
    const user = userEvent.setup();
    mockUpdateFn.mockResolvedValue(undefined);

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalledWith({
        projectId: 'project123',
        userId: 'user123',
        name: 'Мой Проект',
      });
    });
  });

  it('save button includes crmProvider when selected', async () => {
    const user = userEvent.setup();
    mockUpdateFn.mockResolvedValue(undefined);

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    const crmSelect = screen.getByDisplayValue('Не выбрана');
    await user.selectOptions(crmSelect, 'amocrm');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(mockUpdateFn).toHaveBeenCalledWith({
        projectId: 'project123',
        userId: 'user123',
        name: 'Мой Проект',
        crmProvider: 'amocrm',
      });
    });
  });

  it('shows saving state on save button', async () => {
    const user = userEvent.setup();
    let resolveSave: (value: any) => void;
    mockUpdateFn.mockImplementation(() => new Promise((resolve) => {
      resolveSave = resolve;
    }));

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.getByText('Сохранение...')).toBeInTheDocument();
    });

    resolveSave!(undefined);

    await waitFor(() => {
      expect(screen.getByText('Сохранено!')).toBeInTheDocument();
    });
  });

  it('delete button with confirmation calls remove mutation', async () => {
    const user = userEvent.setup();
    mockRemoveFn.mockResolvedValue(undefined);
    // Mock window.confirm to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Вы уверены, что хотите удалить этот проект? Это действие необратимо.'
      );
      expect(mockRemoveFn).toHaveBeenCalledWith({
        projectId: 'project123',
        userId: 'user123',
      });
    });
  });

  it('does not call remove mutation if confirmation is declined', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));

    expect(mockRemoveFn).not.toHaveBeenCalled();
  });

  it('calls onDeleted after successful deletion', async () => {
    const user = userEvent.setup();
    mockRemoveFn.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));

    await waitFor(() => {
      expect(mockOnDeleted).toHaveBeenCalled();
    });
  });

  it('shows delete loading state', async () => {
    const user = userEvent.setup();
    let resolveDelete: (value: any) => void;
    mockRemoveFn.mockImplementation(() => new Promise((resolve) => {
      resolveDelete = resolve;
    }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    await user.click(screen.getByRole('button', { name: 'Удалить дашборд' }));

    await waitFor(() => {
      expect(screen.getByText('Удаление...')).toBeInTheDocument();
    });

    resolveDelete!(undefined);
    await waitFor(() => {
      expect(mockOnDeleted).toHaveBeenCalled();
    });
  });

  it('renders status toggle', () => {
    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Дашборд активен')).toBeInTheDocument();
  });

  it('can edit dashboard name', async () => {
    const user = userEvent.setup();

    render(<Settings project={mockProject} userId={mockUserId} onDeleted={mockOnDeleted} />);

    const nameInput = screen.getByDisplayValue('Мой Проект') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Новое Название');

    expect(nameInput.value).toBe('Новое Название');
  });

  it('renders pre-filled CRM provider when project has one', () => {
    const projectWithCrm = {
      ...mockProject,
      crmProvider: 'amocrm' as const,
    };

    render(<Settings project={projectWithCrm} userId={mockUserId} onDeleted={mockOnDeleted} />);

    expect(screen.getByDisplayValue('AmoCRM')).toBeInTheDocument();
    // Webhook URL should be visible
    expect(screen.getByText('Webhook URL')).toBeInTheDocument();
  });
});
