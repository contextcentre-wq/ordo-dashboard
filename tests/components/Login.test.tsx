import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock convex/react hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(),
  ConvexProvider: ({ children }: any) => children,
}));

// Mock the generated API
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
import Login from '../../components/auth/Login';

describe('Login', () => {
  const mockOnLogin = vi.fn();
  const mockOnSwitchToRegister = vi.fn();
  let mockLoginFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginFn = vi.fn();
    vi.mocked(useMutation).mockReturnValue(mockLoginFn);
  });

  it('renders email input and login button', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('shows "Войти" button text', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const loginButton = screen.getByRole('button', { name: 'Войти' });
    expect(loginButton).toHaveTextContent('Войти');
  });

  it('renders the descriptive text', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    expect(screen.getByText('Войдите, чтобы продолжить работу')).toBeInTheDocument();
  });

  it('calls login mutation on submit with email', async () => {
    const user = userEvent.setup();
    mockLoginFn.mockResolvedValue({ _id: 'user123' });

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  it('calls onLogin(userId) on success', async () => {
    const user = userEvent.setup();
    mockLoginFn.mockResolvedValue({ _id: 'user123' });

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('user123');
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    mockLoginFn.mockRejectedValue(new Error('[CONVEX M(auth:login)] Uncaught Error: User not found'));

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'bad@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Пользователь с таким email не найден')).toBeInTheDocument();
    });
  });

  it('shows generic error when error has no message', async () => {
    const user = userEvent.setup();
    mockLoginFn.mockRejectedValue({});

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'bad@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Ошибка входа')).toBeInTheDocument();
    });
  });

  it('shows loading state during submit', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: any) => void;
    mockLoginFn.mockImplementation(() => new Promise((resolve) => {
      resolveLogin = resolve;
    }));

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(screen.getByText('Вход...')).toBeInTheDocument();
    });

    // Resolve so the test cleanup is clean
    resolveLogin!({ _id: 'user123' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    });
  });

  it('has link to switch to registration view', async () => {
    const user = userEvent.setup();

    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const registerLink = screen.getByRole('button', { name: 'Регистрация' });
    expect(registerLink).toBeInTheDocument();

    await user.click(registerLink);
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it('has "Нет аккаунта?" text', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    expect(screen.getByText(/Нет аккаунта\?/)).toBeInTheDocument();
  });

  it('email input is required', () => {
    render(<Login onLogin={mockOnLogin} onSwitchToRegister={mockOnSwitchToRegister} />);

    const emailInput = screen.getByPlaceholderText('name@company.com');
    expect(emailInput).toBeRequired();
  });
});
