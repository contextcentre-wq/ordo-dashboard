import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Analytics from './components/pages/Analytics';
import Members from './components/pages/Members';
import Settings from './components/pages/Settings';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProjectSelect from './components/ProjectSelect';
import { Page, Project } from './types';

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'CL128', createdAt: '12 января 2025' },
  { id: 'p2', name: 'Marketing Pro', createdAt: '3 февраля 2025' },
  { id: 'p3', name: 'Innovo Dent', createdAt: '18 февраля 2025' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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
        className="relative px-8 md:px-12 py-6 h-screen max-h-screen mx-auto flex flex-col bg-slate-50 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 60 : 220 }}
      >
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
