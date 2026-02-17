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

import { useMutation } from 'convex/react';
import Register from '../../components/auth/Register';

describe('Register', () => {
  const mockOnRegister = vi.fn();
  const mockOnSwitchToLogin = vi.fn();
  let mockRegisterFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterFn = vi.fn();
    vi.mocked(useMutation).mockReturnValue(mockRegisterFn);
  });

  it('renders name, email, phone, and company fields', () => {
    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByPlaceholderText('Иван Петров')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Мой Бизнес ООО')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+7 (XXX) XXX XX-XX')).toBeInTheDocument();
  });

  it('renders descriptive text', () => {
    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByText('Создайте аккаунт и начните анализировать')).toBeInTheDocument();
  });

  it('shows submit button with correct text', () => {
    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByRole('button', { name: 'Начать работу' })).toBeInTheDocument();
  });

  it('calls register mutation with name, email, phone on submit', async () => {
    const user = userEvent.setup();
    mockRegisterFn.mockResolvedValue('userId-abc');

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'ivan@test.com');
    await user.type(screen.getByPlaceholderText('+7 (XXX) XXX XX-XX'), '+79991234567');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(mockRegisterFn).toHaveBeenCalledWith({
        email: 'ivan@test.com',
        name: 'Иван',
        phone: '+79991234567',
      });
    });
  });

  it('appends company to name if company field is filled', async () => {
    const user = userEvent.setup();
    mockRegisterFn.mockResolvedValue('userId-abc');

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('Мой Бизнес ООО'), 'ORDO Inc');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'ivan@test.com');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(mockRegisterFn).toHaveBeenCalledWith({
        email: 'ivan@test.com',
        name: 'Иван (ORDO Inc)',
        phone: undefined,
      });
    });
  });

  it('passes phone as undefined when empty', async () => {
    const user = userEvent.setup();
    mockRegisterFn.mockResolvedValue('userId-abc');

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'ivan@test.com');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(mockRegisterFn).toHaveBeenCalledWith({
        email: 'ivan@test.com',
        name: 'Иван',
        phone: undefined,
      });
    });
  });

  it('calls onRegister(userId) on success', async () => {
    const user = userEvent.setup();
    mockRegisterFn.mockResolvedValue('userId-abc');

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'ivan@test.com');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(mockOnRegister).toHaveBeenCalledWith('userId-abc');
    });
  });

  it('shows error on duplicate email / registration failure', async () => {
    const user = userEvent.setup();
    mockRegisterFn.mockRejectedValue(new Error('[CONVEX M(auth:register)] Uncaught Error: Email already registered'));

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'existing@test.com');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(screen.getByText('Этот email уже зарегистрирован')).toBeInTheDocument();
    });
  });

  it('shows generic error when error has no message', async () => {
    const user = userEvent.setup();
    mockRegisterFn.mockRejectedValue({});

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(screen.getByText('Ошибка регистрации')).toBeInTheDocument();
    });
  });

  it('shows loading state during submit', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: any) => void;
    mockRegisterFn.mockImplementation(() => new Promise((resolve) => {
      resolveRegister = resolve;
    }));

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    await user.type(screen.getByPlaceholderText('Иван Петров'), 'Иван');
    await user.type(screen.getByPlaceholderText('name@company.com'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: 'Начать работу' }));

    await waitFor(() => {
      expect(screen.getByText('Создание...')).toBeInTheDocument();
    });

    resolveRegister!('userId-abc');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Начать работу' })).toBeInTheDocument();
    });
  });

  it('has link to switch to login view', async () => {
    const user = userEvent.setup();

    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByText(/Уже есть аккаунт\?/)).toBeInTheDocument();

    const loginLink = screen.getByRole('button', { name: 'Войти' });
    expect(loginLink).toBeInTheDocument();

    await user.click(loginLink);
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('name and email fields are required', () => {
    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByPlaceholderText('Иван Петров')).toBeRequired();
    expect(screen.getByPlaceholderText('name@company.com')).toBeRequired();
  });

  it('phone and company fields are optional (not required)', () => {
    render(<Register onRegister={mockOnRegister} onSwitchToLogin={mockOnSwitchToLogin} />);

    expect(screen.getByPlaceholderText('+7 (XXX) XXX XX-XX')).not.toBeRequired();
    expect(screen.getByPlaceholderText('Мой Бизнес ООО')).not.toBeRequired();
  });
});
