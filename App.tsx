import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Analytics from './components/pages/Analytics';
import Members from './components/pages/Members';
import Settings from './components/pages/Settings';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { Page } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  // Auth Flow
  if (!isAuthenticated) {
    if (authView === 'login') {
      return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />;
    } else {
      return <Register onRegister={handleLogin} onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  // Protected App Flow
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'members':
        return <Members />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="bg-slate-50 font-sans text-ordo-text">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
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
