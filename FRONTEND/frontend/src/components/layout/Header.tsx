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
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="btn-icon lg:hidden p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 truncate">{title}</h2>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:outline-none w-40 md:w-auto"
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`btn-icon relative p-2 rounded-lg transition-colors ${
                isSubscribed
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Notificaciones"
            >
              <Bell className={`h-5 w-5 ${isSubscribed ? 'fill-emerald-100' : ''}`} />
              {appointments.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Notificaciones</h3>
                  {isSubscribed ? (
                    <button
                      onClick={unsubscribe}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={subscribe}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No hay citas para hoy
                    </div>
                  ) : (
                    appointments.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => { navigate('/citas'); setShowDropdown(false); }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {[app.paciente?.nombres, app.paciente?.apellidos].filter(Boolean).join(' ') || 'Paciente'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {app.servicio?.nombre || 'Servicio'} &middot; {app.hora || app.fecha_hora?.slice(11, 16)}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          app.estado === 'PEND' ? 'bg-yellow-100 text-yellow-700' :
                          app.estado === 'CONF' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {app.estado}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {appointments.length > 0 && (
                  <button
                    onClick={() => { navigate('/citas'); setShowDropdown(false); }}
                    className="w-full px-4 py-2.5 text-center text-sm text-emerald-600 hover:bg-emerald-50 font-medium border-t border-gray-100"
                  >
                    Ver todas las citas
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="items-center gap-2 hidden sm:flex">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{user?.email || 'Usuario'}</p>
              <p className="text-xs text-gray-600">Sistema Principal</p>
            </div>
            <div className="bg-emerald-500 p-2 rounded-full shrink-0">
              <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <button
              onClick={handleLogout}
              className="btn-icon p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
