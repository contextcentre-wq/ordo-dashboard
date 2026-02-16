import React from 'react';
import Header from '../Header';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

const Sources: React.FC = () => {
  const sources = [
    { name: 'Facebook Ads', status: 'connected', accounts: 3, lastSync: '5 mins ago', color: 'bg-blue-600' },
    { name: 'Google Ads', status: 'connected', accounts: 1, lastSync: '12 mins ago', color: 'bg-red-500' },
    { name: 'TikTok Ads', status: 'error', accounts: 0, lastSync: 'Failed', color: 'bg-black' },
    { name: 'Yandex Direct', status: 'disconnected', accounts: 0, lastSync: '-', color: 'bg-yellow-500' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Header />
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Источники трафика</h1>
          <p className="text-gray-500 text-sm mt-1">Управляйте подключениями к рекламным кабинетам</p>
        </div>
        <button className="flex items-center space-x-2 bg-ordo-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-ordo-darkGreen transition-colors min-h-[44px]">
          <Plus className="w-4 h-4" />
          <span>Добавить источник</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:border-green-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-lg ${source.color} flex items-center justify-center text-white font-bold text-xl`}>
                {source.name.charAt(0)}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                source.status === 'connected' ? 'bg-green-50 text-green-700' : 
                source.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {source.status === 'connected' && <CheckCircle2 className="w-3 h-3" />}
                {source.status === 'error' && <AlertCircle className="w-3 h-3" />}
                {source.status === 'connected' ? 'Активен' : source.status === 'error' ? 'Ошибка' : 'Не подключен'}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">{source.name}</h3>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                <div className="text-gray-500">Аккаунтов: <span className="font-semibold text-gray-900">{source.accounts}</span></div>
                <div className="text-gray-400 text-xs">Sync: {source.lastSync}</div>
            </div>

            <div className="mt-6">
                <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Настроить
                </button>
            </div>
          </div>
        ))}
        
        {/* Placeholder for new integration */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-ordo-green hover:bg-green-50/50 transition-all group min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-ordo-green" />
            </div>
            <h3 className="font-semibold text-gray-900">Подключить новый</h3>
            <p className="text-xs text-gray-500 mt-1">CRM, Analytics или Ad Network</p>
        </div>
      </div>
    </div>
  );
};

export default Sources;