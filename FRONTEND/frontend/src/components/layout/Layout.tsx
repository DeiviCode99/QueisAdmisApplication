import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import PageTransition from './PageTransition';
import InstallPrompt from '../pwa/InstallPrompt';
import { ToastContainer } from 'react-toastify';

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/citas': 'Citas',
  '/pacientes': 'Pacientes',
  '/historias-clinicas': 'Historias Clínicas',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
};

export default function Layout() {
  const location = useLocation();
  const title = PATH_TITLES[location.pathname] || 'Dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <InstallPrompt />
        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    </div>
  );
}
