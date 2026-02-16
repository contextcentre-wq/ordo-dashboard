import React from 'react';
import Header from '../Header';
import { Filter, Download, Search, MoreHorizontal } from 'lucide-react';

const Audiences: React.FC = () => {
  const users = [
    { id: 1, name: 'Алексей Петров', email: 'alex.p@example.com', source: 'Facebook Ads', ltv: '$1,200', status: 'Клиент', date: '02.10.2023' },
    { id: 2, name: 'Мария Иванова', email: 'maria.iv@example.com', source: 'Google Ads', ltv: '$0', status: 'Лид', date: '02.10.2023' },
    { id: 3, name: 'ООО "Вектор"', email: 'info@vector-stroy.ru', source: 'Direct', ltv: '$4,500', status: 'VIP', date: '01.10.2023' },
    { id: 4, name: 'Дмитрий С.', email: 'dimas@mail.ru', source: 'Facebook Ads', ltv: '$150', status: 'Отток', date: '30.09.2023' },
    { id: 5, name: 'Елена Козлова', email: 'elena.k@gmail.com', source: 'Instagram', ltv: '$0', status: 'Лид', date: '29.09.2023' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <Header />
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Аудитории</h1>
            <p className="text-gray-500 text-sm mt-1">Список лидов и клиентов из всех источников</p>
        </div>
        <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Экспорт</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-ordo-green text-white rounded-lg text-sm font-medium hover:bg-ordo-darkGreen shadow-sm shadow-green-200">
                <span>Создать сегмент</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/30">
            <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Поиск по email или имени..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900">
                    <Filter className="w-3 h-3" />
                    Фильтры
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-white text-left border-b border-gray-100">
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                            <input type="checkbox" className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green" />
                        </th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Имя / Компания</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Источник</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Статус</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">LTV</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Дата</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 group transition-colors">
                            <td className="px-6 py-4">
                                <input type="checkbox" className="rounded border-gray-300 text-ordo-green focus:ring-ordo-green bg-white accent-ordo-green" />
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                    <span className="text-xs text-gray-400">{user.email}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                    {user.source}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.status === 'Клиент' ? 'bg-green-100 text-green-800' :
                                    user.status === 'VIP' ? 'bg-purple-100 text-purple-800' :
                                    user.status === 'Отток' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-gray-900 font-medium">
                                {user.ltv}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {user.date}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-center">
            <button className="text-sm text-gray-500 hover:text-ordo-green font-medium transition-colors">
                Загрузить еще
            </button>
        </div>
      </div>
    </div>
  );
};

export default Audiences;