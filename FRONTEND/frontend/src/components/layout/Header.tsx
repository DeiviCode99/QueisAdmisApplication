import { Bell, Search, User, LogOut, Menu, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../lib/axiosClient';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

interface Appointment {
  id: number;
  fecha_hora: string;
  hora?: string;
  estado: string;
  paciente?: {
    nombres?: string;
    apellidos?: string;
  };
  servicio?: {
    nombre?: string;
  };
}

const STATUS_STYLES: Record<string, string> = {
  PEND: 'bg-amber-50 text-amber-700 border-amber-200',
  REAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANC: 'bg-red-50 text-red-700 border-red-200',
  CONF: 'bg-brand-50 text-brand-700 border-brand-200',
};

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()!;
  const { isSubscribed, subscribe, unsubscribe } = useNotification()!;
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleDropdown = async () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next && appointments.length === 0) {
      setLoadingApps(true);
      try {
        const data = await api.get('citas/').then(r => r.data);
        const list = Array.isArray(data) ? data : data.results || [];
        const today = new Date().toISOString().slice(0, 10);
        setAppointments(list.filter((a: Appointment) => String(a.fecha_hora).slice(0, 10) === today));
      } catch {
        setAppointments([]);
      }
      setLoadingApps(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-brand-100/50 px-3 sm:px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="btn-icon lg:hidden p-2 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-[10px] transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-heading font-bold text-brand-800 truncate">{title}</h2>
            <p className="text-xs sm:text-sm text-brand-500 hidden sm:block">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-300 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="clay-input pl-10 pr-4 py-2 w-40 md:w-auto text-sm"
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`btn-icon relative p-2 rounded-[10px] transition-all duration-200 ${
                isSubscribed
                  ? 'text-brand-600 bg-brand-50 shadow-[0_2px_8px_rgba(14,165,233,0.1)]'
                  : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'
              }`}
              aria-label="Notificaciones"
            >
              <Bell className={`h-5 w-5 ${isSubscribed ? 'fill-brand-200' : ''}`} />
              {appointments.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 clay-card overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100/50">
                  <h3 className="font-heading font-semibold text-brand-800 text-sm">Notificaciones</h3>
                  {isSubscribed ? (
                    <button
                      onClick={unsubscribe}
                      className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={subscribe}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                      Activar
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {loadingApps ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">Cargando...</div>
                  ) : appointments.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-brand-200" />
                      No hay citas para hoy
                    </div>
                  ) : (
                    appointments.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => { navigate('/citas'); setShowDropdown(false); }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-brand-50/70 transition-colors text-left border-b border-brand-50/50 last:border-0"
                      >
                        <div className="bg-brand-100 p-2 rounded-[10px] shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                          <Calendar className="h-4 w-4 text-brand-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-800 truncate">
                            {[app.paciente?.nombres, app.paciente?.apellidos].filter(Boolean).join(' ') || 'Paciente'}
                          </p>
                          <p className="text-xs text-brand-500 truncate">
                            {app.servicio?.nombre || 'Servicio'} &middot; {app.hora || app.fecha_hora?.slice(11, 16)}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[app.estado] || 'bg-gray-50 text-gray-600 border-gray-200'} shrink-0`}>
                          {app.estado}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {appointments.length > 0 && (
                  <button
                    onClick={() => { navigate('/citas'); setShowDropdown(false); }}
                    className="w-full px-4 py-2.5 text-center text-sm text-brand-600 hover:bg-brand-50/70 font-medium border-t border-brand-100/50"
                  >
                    Ver todas las citas
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="items-center gap-2 hidden sm:flex">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-brand-800 truncate max-w-[120px]">{user?.email || 'Usuario'}</p>
              <p className="text-xs text-brand-500">Sistema Principal</p>
            </div>
            <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2 rounded-[10px] shrink-0 shadow-[0_2px_8px_rgba(14,165,233,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]">
              <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <button
              onClick={handleLogout}
              className="btn-icon p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
