import React from 'react';

interface LoginProps {
    onLogin: () => void;
    onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  return (
    <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
                <p className="text-gray-500">Войдите, чтобы продолжить работу</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                        type="email" 
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required 
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Пароль</label>
                        <a href="#" className="text-xs text-ordo-green hover:text-ordo-darkGreen font-medium">Забыли пароль?</a>
                    </div>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required 
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full py-3.5 bg-ordo-green text-white rounded-xl font-bold text-lg hover:bg-ordo-darkGreen transition-all transform hover:scale-[1.02] shadow-lg shadow-green-200"
                >
                    Войти
                </button>
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