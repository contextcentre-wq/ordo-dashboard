import React from 'react';
import { LayoutDashboard, Share2, Users, Settings } from 'lucide-react';
import { Page } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { page: 'sources', icon: Share2, label: 'Источники' },
  { page: 'audiences', icon: Users, label: 'Аудитории' },
  { page: 'settings', icon: Settings, label: 'Настройки' },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-stretch"
        style={{ paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex-1 flex flex-col items-center justify-center min-h-[56px] relative transition-colors ${
                isActive ? 'text-ordo-green' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-ordo-green rounded-b" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Desktop sidebar
  const getButtonClass = (page: Page) => {
    const isActive = activePage === page;
    if (isActive) {
      return "w-10 h-10 bg-ordo-green rounded-full flex items-center justify-center shadow-lg shadow-green-200 text-white transition-all duration-200";
    }
    return "w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-600";
  };

  return (
    <div className="w-[70px] bg-white h-screen fixed left-0 top-0 border-r border-gray-200 hidden md:flex flex-col items-center py-6 z-50">
      <div className="flex flex-col space-y-8">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <div key={page} className="relative group cursor-pointer" onClick={() => onNavigate(page)}>
            <div className={getButtonClass(page)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
