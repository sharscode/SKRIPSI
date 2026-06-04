import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="layout-root">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={`layout-main ${collapsed ? 'layout-collapsed' : ''}`}>
        <Topbar sidebarCollapsed={collapsed} onMenuClick={() => setCollapsed((c) => !c)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
