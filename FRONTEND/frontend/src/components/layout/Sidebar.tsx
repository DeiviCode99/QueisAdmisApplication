import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, FileText, BarChart3, Settings, FileBarChart, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from "../../assets/icon.png"

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/citas', label: 'Citas', icon: Calendar },
  { path: '/pacientes', label: 'Pacientes', icon: Users },
  { path: '/historias-clinicas', label: 'Historias Clínicas', icon: FileText },
  { path: '/reportes', label: 'Reportes', icon: FileBarChart },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          w-64 h-screen flex flex-col shrink-0
          fixed lg:sticky top-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-gradient-to-b from-brand-50/90 via-white to-brand-50/70
          backdrop-blur-xl border-r border-brand-100/50
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-brand-100/50">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src={Logo}/>
            </div>
            <div>
              <span className="font-heading font-bold text-brand-800 text-lg leading-tight block">Queis Admin</span>
              <span className="text-[10px] text-brand-500 font-medium tracking-wide">SPA Management</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon lg:hidden p-1.5 rounded-[8px] hover:bg-brand-100 transition-all duration-200"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-brand-600" />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1.5">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path} className={`${mounted ? `animate-fade-in-up` : ''}`} style={{ animationDelay: `${index * 40}ms` }}>
                  <button
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-all duration-200 min-h-[44px] ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]'
                        : 'text-brand-800/70 hover:bg-brand-100/70 hover:text-brand-700'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-brand-100/50">
          <div className="bg-brand-50/60 rounded-[10px] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <p className="text-xs font-heading font-semibold text-brand-700">Queis Admin</p>
            <p className="text-[10px] text-brand-500">Application v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
