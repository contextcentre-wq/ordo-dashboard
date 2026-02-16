import React from 'react';
import { LayoutDashboard, Share2, Users, Settings } from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  
  const getButtonClass = (page: Page) => {
    const isActive = activePage === page;
    if (isActive) {
      return "w-10 h-10 bg-ordo-green rounded-full flex items-center justify-center shadow-lg shadow-green-200 text-white transition-all duration-200";
    }
    return "w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600";
  };

  return (
    <div className="w-[70px] bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex flex-col items-center py-6 z-50">
      <div className="flex flex-col space-y-8">
        {/* Dashboard */}
        <div className="relative group cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className={getButtonClass('dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Дашборд
          </div>
        </div>

        {/* Sources / Network */}
        <div className="relative group cursor-pointer" onClick={() => onNavigate('sources')}>
          <div className={getButtonClass('sources')}>
            <Share2 className="w-5 h-5" />
          </div>
          <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Источники
          </div>
        </div>

        {/* Audiences / People */}
        <div className="relative group cursor-pointer" onClick={() => onNavigate('audiences')}>
          <div className={getButtonClass('audiences')}>
            <Users className="w-5 h-5" />
          </div>
          <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Аудитории
          </div>
        </div>

        {/* Settings */}
        <div className="relative group cursor-pointer mt-auto" onClick={() => onNavigate('settings')}>
          <div className={getButtonClass('settings')}>
            <Settings className="w-5 h-5" />
          </div>
          <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Настройки
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;