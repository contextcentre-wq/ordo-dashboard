import React, { useState } from 'react';
import Header from '../Header';
import { LogOut } from 'lucide-react';

interface SettingsProps {
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const [dashboardName, setDashboardName] = useState('CL128');
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Header />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 text-sm mt-1">Основные настройки дашборда</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Основные</h2>

        <div className="space-y-6">
          {/* Dashboard name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название дашборда</label>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green outline-none transition-all bg-white text-gray-900"
            />
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">Статус</label>
              <p className="text-xs text-gray-400 mt-0.5">{isActive ? 'Дашборд активен' : 'Дашборд неактивен'}</p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-ordo-green' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти из аккаунта
            </button>
          </div>

          {/* Delete dashboard */}
          <div className="pt-4 border-t border-gray-100">
            <button className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Удалить дашборд
            </button>
            <p className="text-xs text-gray-400 mt-2">Это действие нельзя отменить. Все данные будут удалены.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
