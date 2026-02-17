import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Table2, Users, Settings, PanelLeftClose, PanelLeft, ChevronsUpDown, Check, ArrowLeft } from 'lucide-react';
import { Page, Project } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeProject: Project;
  projects: Project[];
  onSwitchProject: (id: string) => void;
  onBackToProjects: () => void;
}

const NAV_ITEMS: { page: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { page: 'analytics', icon: Table2, label: 'Аналитика' },
  { page: 'members', icon: Users, label: 'Участники' },
  { page: 'settings', icon: Settings, label: 'Настройки' },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, collapsed, onToggleCollapse, activeProject, projects, onSwitchProject, onBackToProjects }) => {
  const isMobile = useIsMobile();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

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
              <span className="text-[11px] mt-0.5 font-medium">{label}</span>
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
      {/* Project switcher area */}
      <div className={`h-14 flex items-center border-b border-gray-100 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-3'}`} ref={dropdownRef}>
        {collapsed ? (
          <button
            onClick={onBackToProjects}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            title={activeProject.name}
          >
            <span className="text-gray-900 font-semibold text-lg">{activeProject.name[0]}</span>
          </button>
        ) : (
          <div className="relative w-full">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900 font-semibold text-sm truncate flex-1 text-left">{activeProject.name}</span>
              <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onSwitchProject(p.id); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-1 truncate text-gray-700">{p.name}</span>
                    {p.id === activeProject.id && (
                      <Check className="w-4 h-4 text-ordo-green shrink-0" />
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { onBackToProjects(); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Все проекты</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
