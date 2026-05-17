import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const title = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Sidebar — mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 lg:hidden transition-transform duration-200',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setMobileSidebarOpen((v) => !v)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
