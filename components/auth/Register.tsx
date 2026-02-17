import React from 'react';

interface RegisterProps {
    onRegister: () => void;
    onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
                <p className="text-gray-500">Создайте аккаунт и начните анализировать</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onRegister(); }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
                    <input 
                        type="text" 
                        placeholder="Иван Петров"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
                    <input 
                        type="text" 
                        placeholder="Мой Бизнес ООО"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                        type="email" 
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        required 
                    />
                    <p className="text-xs text-gray-400 mt-1">Минимум 8 символов</p>
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        className="w-full py-3.5 bg-ordo-green text-white rounded-xl font-bold text-lg hover:bg-ordo-darkGreen transition-all transform hover:scale-[1.02] shadow-lg shadow-sky-200"
                    >
                        Начать работу
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                    Уже есть аккаунт?{' '}
                    <button onClick={onSwitchToLogin} className="text-ordo-green font-bold hover:text-ordo-darkGreen">
                        Войти
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Register;