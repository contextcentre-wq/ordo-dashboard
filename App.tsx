import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Analytics from './components/pages/Analytics';
import Members from './components/pages/Members';
import Settings from './components/pages/Settings';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProjectSelect from './components/ProjectSelect';
import { Page, Project } from './types';
import { useIsMobile } from './hooks/useIsMobile';
import { ChevronsUpDown, Check, ArrowLeft } from 'lucide-react';

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'CL128', createdAt: '12 января 2025' },
  { id: 'p2', name: 'Marketing Pro', createdAt: '3 февраля 2025' },
  { id: 'p3', name: 'Innovo Dent', createdAt: '18 февраля 2025' },
];

const App: React.FC = () => {
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileProjectDropdown, setMobileProjectDropdown] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)) {
        setMobileProjectDropdown(false);
      }
    };
    if (mobileProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileProjectDropdown]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setActivePage('dashboard');
  };

  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: `p${Date.now()}`,
      name,
      createdAt: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setActivePage('dashboard');
  };

  const handleBackToProjects = () => {
    setActiveProjectId(null);
  };

  // Phase 1: Auth
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
    } else {
      return <Register onRegister={handleLogin} onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  // Phase 2: Project selection
  if (!activeProject) {
    return (
      <ProjectSelect
        projects={projects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
      />
    );
  }

  // Phase 3: Protected App
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard project={activeProject} />;
      case 'analytics':
        return <Analytics project={activeProject} />;
      case 'members':
        return <Members project={activeProject} />;
      case 'settings':
        return <Settings project={activeProject} />;
      default:
        return <Dashboard project={activeProject} />;
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-ordo-text">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        activeProject={activeProject}
        projects={projects}
        onSwitchProject={handleSelectProject}
        onBackToProjects={handleBackToProjects}
      />

      <main
        className={`relative py-6 h-screen max-h-screen mx-auto flex flex-col bg-slate-50 overflow-y-auto transition-all duration-300 ${
          isMobile ? 'px-4 pb-20' : 'px-8 md:px-12'
        }`}
        style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 60 : 220) }}
      >
        {isMobile && (
          <div className="relative mb-4 shrink-0" ref={mobileDropdownRef}>
            <button
              onClick={() => setMobileProjectDropdown(prev => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors w-full"
            >
              <span className="text-sm font-semibold text-gray-900 truncate flex-1 text-left">{activeProject.name}</span>
              <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {mobileProjectDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { handleSelectProject(p.id); setMobileProjectDropdown(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-1 truncate text-gray-700">{p.name}</span>
                    {p.id === activeProject.id && (
                      <Check className="w-4 h-4 text-ordo-green shrink-0" />
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { handleBackToProjects(); setMobileProjectDropdown(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Все проекты</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
