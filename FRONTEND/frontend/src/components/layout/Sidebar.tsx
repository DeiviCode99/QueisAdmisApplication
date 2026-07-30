import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, FileText, BarChart3, Settings, FileBarChart, X, type LucideIcon } from 'lucide-react';
import logo from '../../assets/icon.png';

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

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          w-64 bg-gradient-to-b from-emerald-50 to-teal-50 border-r border-emerald-100
          h-screen flex flex-col shrink-0
          fixed lg:sticky top-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="" />
          </div>
          <button
            onClick={onClose}
            className="btn-icon lg:hidden p-1 rounded-lg hover:bg-emerald-200 transition-all duration-200"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-emerald-700" />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path} className={`animate-fade-in stagger-${index + 1}`}>
                  <button
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 min-h-[44px] ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-emerald-100">
          <div className="text-xs text-gray-500 text-center">
            <p>Belleza Plena Centro Spa</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
