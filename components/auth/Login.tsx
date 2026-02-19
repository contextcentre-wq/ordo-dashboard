import React, { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LoginProps {
    onLogin: (userId: string) => void;
    onSwitchToRegister: () => void;
}

const ERROR_MESSAGES: [RegExp, string][] = [
  [/User not found/i, 'Пользователь с таким email не найден'],
  [/Invalid password/i, 'Неверный пароль'],
  [/Email already registered/i, 'Этот email уже зарегистрирован'],
  [/Access denied/i, 'Доступ запрещён'],
];

function humanizeError(err: any): string {
  const raw = err?.data ?? err?.message ?? '';
  for (const [pattern, message] of ERROR_MESSAGES) {
    if (pattern.test(raw)) return message;
  }
  return 'Ошибка входа';
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginMutation = useMutation(api.auth.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginMutation({ email, password });
      onLogin(result._id);
    } catch (err: any) {
      setError(humanizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
                <p className="text-gray-500">Войдите, чтобы продолжить работу</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                    <input
                        type="password"
                        placeholder="Введите пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required
                    />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-ordo-green text-white rounded-xl font-bold text-lg hover:bg-ordo-darkGreen transition-all transform hover:scale-[1.02] shadow-lg shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                    Нет аккаунта?{' '}
                    <button onClick={onSwitchToRegister} className="text-ordo-green font-bold hover:text-ordo-darkGreen">
                        Регистрация
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Login;
