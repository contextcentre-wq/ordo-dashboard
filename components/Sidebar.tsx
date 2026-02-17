import React, { useState } from 'react';
import { LayoutDashboard, Table2, Users, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Page } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: { page: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { page: 'analytics', icon: Table2, label: 'Аналитика' },
  { page: 'members', icon: Users, label: 'Участники' },
  { page: 'settings', icon: Settings, label: 'Настройки' },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, collapsed, onToggleCollapse }) => {
  const isMobile = useIsMobile();

  // Mobile: bottom nav (unchanged)
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

  // Desktop: collapsible sidebar
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-30 hidden md:flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[60px]' : 'w-[220px]'
      }`}
    >
      {/* Title area */}
      <div className={`h-14 flex items-center border-b border-gray-100 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        {!collapsed && (
          <span className="text-gray-900 font-semibold text-lg tracking-tight">CL128</span>
        )}
        {collapsed && (
          <span className="text-gray-900 font-semibold text-lg">C</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex items-center gap-3 rounded-lg transition-all duration-150 ${
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 h-10 w-full'
              } ${
                isActive
                  ? 'bg-ordo-green text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle at bottom */}
      <div className={`border-t border-gray-100 py-3 px-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={onToggleCollapse}
          className={`flex items-center gap-3 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150 ${
            collapsed ? 'justify-center h-10 w-10' : 'px-3 h-10 w-full'
          }`}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="w-[18px] h-[18px] shrink-0" />
              <span className="text-sm font-medium">Свернуть</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
