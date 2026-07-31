import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle, X, Sparkles, Plus } from 'lucide-react';
import StatsCard from './StatsCard';
import { getPatients, getAppointments, getReportsList } from '../../lib/api';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import PatientForm from '../patients/PatientForm';
import AppointmentForm from '../appointments/AppointmentForm';

interface Appointment {
  id: number;
  fecha_hora: string;
  hora: string;
  estado: string;
  saldo_pend: string;
  paciente?: { nombres: string; apellidos: string };
  servicio?: { nombre: string };
  colaborador?: { nombres: string; apellidos: string };
  notas?: string;
}

interface Report {
  nombre: string;
  pdf_url: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    completedTreatments: 0
  });

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (showReportsModal) loadReports();
  }, [showReportsModal]);

  const loadDashboardData = async () => {
    try {
      const [patients, appointments] = await Promise.all([
        getPatients(),
        getAppointments()
      ]) as unknown as [Record<string, unknown>[], Appointment[]];

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(apt => apt.fecha_hora === today);

      const thisMonth = new Date();
      const monthlyAppointments = appointments.filter(apt => {
        const aptDate = parseISO(apt.fecha_hora);
        return (
          aptDate.getMonth() === thisMonth.getMonth() &&
          aptDate.getFullYear() === thisMonth.getFullYear() &&
          apt.estado === 'REAL'
        );
      });

      const monthlyRevenue = monthlyAppointments.reduce((sum, apt) => {
        const precio = parseFloat(apt.saldo_pend);
        return sum + (isNaN(precio) ? 0 : precio);
      }, 0);

      const completedTreatments = appointments.filter(apt => apt.estado === 'REAL').length;

      const upcoming = appointments
        .filter(apt => {
          const aptDate = parseISO(apt.fecha_hora);
          const now = new Date();
          return (
            (isToday(aptDate) || aptDate > now) &&
            apt.estado === 'PEND'
          );
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.fecha_hora}T${a.hora}`);
          const dateB = new Date(`${b.fecha_hora}T${b.hora}`);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 3);

      setStats({
        totalPatients: patients.length,
        todayAppointments: todayAppointments.length,
        monthlyRevenue,
        completedTreatments
      });

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadReports = async () => {
    try {
      const data = await getReportsList() as unknown as Report[];
      setReports(data);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <StatsCard title="Total Pacientes" value={stats.totalPatients} icon={Users} color="brand" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <StatsCard title="Citas Hoy" value={stats.todayAppointments} icon={Calendar} color="blue" />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <StatsCard
            title="Ingresos del Mes"
            value={Number(stats.monthlyRevenue).toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            icon={DollarSign}
            color="accent"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <StatsCard title="Tratamientos Completados" value={stats.completedTreatments} icon={CheckCircle} color="rose" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clay-card p-6">
          <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              className="clay-btn py-4 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex flex-col items-center gap-2"
              onClick={() => setShowAppointmentForm(true)}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">Nueva Cita</span>
            </button>
            <button
              className="clay-btn py-4 bg-gradient-to-b from-accent-400 to-accent-500 text-white flex flex-col items-center gap-2"
              onClick={() => setShowPatientForm(true)}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Nuevo Paciente</span>
            </button>
            <button
              className="clay-btn py-4 bg-gradient-to-b from-amber-400 to-amber-500 text-white flex flex-col items-center gap-2"
              onClick={() => setShowReportsModal(true)}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-medium">Reportes</span>
            </button>
          </div>
        </div>

        <div className="clay-card p-6">
          <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">Próximas Citas</h3>
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-brand-50 p-3 rounded-[12px] mb-3">
                  <Calendar className="h-6 w-6 text-brand-400" />
                </div>
                <p className="text-sm text-brand-500">No hay citas programadas</p>
              </div>
            ) : (
              upcomingAppointments.map((appointment) => {
                const aptDate = parseISO(appointment.fecha_hora);
                let dateLabel = format(aptDate, 'dd MMM', { locale: es });

                if (isToday(aptDate)) dateLabel = 'Hoy';
                else if (isTomorrow(aptDate)) dateLabel = 'Mañana';

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[12px] cursor-pointer hover:bg-brand-100/50 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="bg-white p-2.5 rounded-[10px] shadow-[inset_2px_2px_6px_rgba(14,165,233,0.04)]">
                      <Clock className="h-4 w-4 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand-800 text-sm truncate">
                        {appointment.paciente?.nombres} {appointment.paciente?.apellidos}
                      </p>
                      <p className="text-xs text-brand-500 truncate">
                        {appointment.servicio?.nombre} — {dateLabel} {appointment.hora}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-lg rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              className="absolute top-3 right-3 text-brand-400 hover:text-brand-600 transition-colors"
              onClick={() => setSelectedAppointment(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-heading font-semibold mb-4 text-brand-800">Detalle de la Cita</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm font-medium text-brand-600 w-24 shrink-0">Paciente:</span>
                <span className="text-sm text-brand-800">{selectedAppointment.paciente?.nombres} {selectedAppointment.paciente?.apellidos}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm font-medium text-brand-600 w-24 shrink-0">Servicio:</span>
                <span className="text-sm text-brand-800">{selectedAppointment.servicio?.nombre}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm font-medium text-brand-600 w-24 shrink-0">Colaborador:</span>
                <span className="text-sm text-brand-800">{selectedAppointment.colaborador?.nombres} {selectedAppointment.colaborador?.apellidos}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm font-medium text-brand-600 w-24 shrink-0">Fecha:</span>
                <span className="text-sm text-brand-800">{selectedAppointment.fecha_hora}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm font-medium text-brand-600 w-24 shrink-0">Hora:</span>
                <span className="text-sm text-brand-800">{selectedAppointment.hora}</span>
              </div>
              <div className="p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm font-medium text-brand-600 block mb-1">Notas:</span>
                <span className="text-sm text-brand-800">{selectedAppointment.notas || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-lg rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              onClick={() => setShowReportsModal(false)}
              className="absolute top-3 right-3 text-brand-400 hover:text-brand-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-heading font-semibold text-brand-800 mb-4">Reportes Mensuales</h2>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-brand-50 p-3 rounded-[12px] inline-flex mb-3">
                  <TrendingUp className="h-6 w-6 text-brand-400" />
                </div>
                <p className="text-sm text-brand-500">No hay reportes disponibles.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {reports.map((reporte, index) => (
                  <li key={index} className="flex justify-between items-center px-4 py-3 bg-brand-50/50 rounded-[10px]">
                    <span className="text-sm font-medium text-brand-700">{reporte.nombre}</span>
                    <a
                      href={reporte.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="clay-btn text-xs px-3 py-1.5 bg-gradient-to-b from-brand-400 to-brand-500 text-white"
                    >
                      Descargar PDF
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-2xl rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              className="absolute top-3 right-3 text-brand-400 hover:text-brand-600 transition-colors"
              onClick={() => setShowAppointmentForm(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <AppointmentForm
              onSave={() => {
                setShowAppointmentForm(false);
                loadDashboardData();
              }}
              onCancel={() => setShowAppointmentForm(false)}
            />
          </div>
        </div>
      )}

      {showPatientForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-2xl rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              className="absolute top-3 right-3 text-brand-400 hover:text-brand-600 transition-colors"
              onClick={() => setShowPatientForm(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <PatientForm
              onSave={() => {
                setShowPatientForm(false);
                loadDashboardData();
              }}
              onCancel={() => setShowPatientForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
