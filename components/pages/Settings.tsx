import React from 'react';
import Header from '../Header';
import { User, Bell, CreditCard, Shield, LogOut } from 'lucide-react';

interface SettingsProps {
    onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  return (
    <div className="p-6 lg:p-8">
      <Header />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки аккаунта</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Nav */}
        <div className="md:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <a href="#" className="flex items-center gap-3 px-4 py-3 bg-green-50 text-ordo-darkGreen font-medium border-l-4 border-ordo-green">
                    <User className="w-4 h-4" />
                    Профиль
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <Bell className="w-4 h-4" />
                    Уведомления
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <CreditCard className="w-4 h-4" />
                    Оплата и тарифы
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <Shield className="w-4 h-4" />
                    Безопасность
                </a>
                <div className="border-t border-gray-100 mt-2 pt-2">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left">
                        <LogOut className="w-4 h-4" />
                        Выйти
                    </button>
                </div>
            </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Личные данные</h2>
                
                <div className="space-y-6 max-w-lg">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                            MK
                        </div>
                        <div>
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Загрузить фото
                            </button>
                            <p className="text-xs text-gray-400 mt-2">JPG, GIF или PNG. Максимум 2MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                            <input 
                                type="text" 
                                defaultValue="Михаил" 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white text-gray-900" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                            <input 
                                type="text" 
                                defaultValue="Козлов" 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white text-gray-900" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            defaultValue="m.kozlov@ordo.io" 
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white text-gray-900" 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
                        <input 
                            type="text" 
                            defaultValue="ORDO Analytics LLC" 
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white text-gray-900" 
                        />
                    </div>

                    <div className="pt-4">
                        <button className="px-6 py-2 bg-ordo-green text-white rounded-lg font-medium hover:bg-ordo-darkGreen transition-colors shadow-lg shadow-green-200/50">
                            Сохранить изменения
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;