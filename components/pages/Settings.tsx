import React, { useState } from 'react';
import Header from '../Header';

const Settings: React.FC = () => {
  const [dashboardName, setDashboardName] = useState('CL128');
  const [isActive, setIsActive] = useState(true);

  return (
    <div>
      <Header />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 text-sm mt-1">Основные настройки дашборда</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Основные</h2>

        <div className="space-y-6">
          {/* Dashboard name */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Название дашборда</label>
            <input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ordo-green/20 focus:border-ordo-green outline-none transition-all bg-gray-100 text-gray-900"
            />
          </div>

          {/* Status toggle */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700">Статус</label>
              <p className="text-xs text-gray-400 mt-0.5">{isActive ? 'Дашборд активен' : 'Дашборд неактивен'}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isActive ? 'bg-ordo-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Delete dashboard */}
          <div className="mt-12 flex w-full justify-end">
            <button className="px-5 py-2.5 bg-gray-100 text-red-500 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Удалить дашборд
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
