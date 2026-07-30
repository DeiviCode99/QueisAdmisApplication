import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle, X } from 'lucide-react';
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
        <div className="animate-fade-in-up stagger-1"><StatsCard title="Total Pacientes" value={stats.totalPatients} icon={Users} color="emerald" /></div>
        <div className="animate-fade-in-up stagger-2"><StatsCard title="Citas Hoy" value={stats.todayAppointments} icon={Calendar} color="blue" /></div>
        <div className="animate-fade-in-up stagger-3">
          <StatsCard
            title="Ingresos del Mes"
            value={Number(stats.monthlyRevenue).toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            icon={DollarSign}
            color="amber"
          />
        </div>
        <div className="animate-fade-in-up stagger-4"><StatsCard title="Tratamientos Completados" value={stats.completedTreatments} icon={CheckCircle} color="rose" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button
              className="btn w-full bg-emerald-500 text-white px-4 py-3 rounded-lg hover:bg-emerald-600 flex items-center space-x-2"
              onClick={() => setShowAppointmentForm(true)}
            >
              <Calendar className="h-5 w-5" />
              <span>Nueva Cita</span>
            </button>
            <button
              className="btn w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              onClick={() => setShowPatientForm(true)}
            >
              <Users className="h-5 w-5" />
              <span>Nuevo Paciente</span>
            </button>
            <button
              className="btn w-full bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 flex items-center space-x-2"
              onClick={() => setShowReportsModal(true)}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Ver Reportes</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximas Citas</h3>
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay citas programadas</p>
            ) : (
              upcomingAppointments.map((appointment) => {
                const aptDate = parseISO(appointment.fecha_hora);
                let dateLabel = format(aptDate, 'dd MMM', { locale: es });

                if (isToday(aptDate)) dateLabel = 'Hoy';
                else if (isTomorrow(aptDate)) dateLabel = 'Mañana';

                return (
                  <div
                    key={appointment.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="bg-emerald-100 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {appointment.paciente?.nombres} {appointment.paciente?.apellidos}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.servicio?.nombre} - {dateLabel} {appointment.hora}
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
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-xl p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedAppointment(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Detalle de la Cita</h3>
            <p><strong>Paciente:</strong> {selectedAppointment.paciente?.nombres} {selectedAppointment.paciente?.apellidos}</p>
            <p><strong>Servicio:</strong> {selectedAppointment.servicio?.nombre}</p>
            <p><strong>Colaborador:</strong> {selectedAppointment.colaborador?.nombres} {selectedAppointment.colaborador?.apellidos}</p>
            <p><strong>Fecha:</strong> {selectedAppointment.fecha_hora}</p>
            <p><strong>Hora:</strong> {selectedAppointment.hora}</p>
            <p><strong>Notas:</strong> {selectedAppointment.notas || 'N/A'}</p>
          </div>
        </div>
      )}

      {showReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-xl p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              onClick={() => setShowReportsModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Reportes Mensuales</h2>
            {reports.length === 0 ? (
              <p className="text-gray-500">No hay reportes disponibles.</p>
            ) : (
              <ul className="space-y-2">
                {reports.map((reporte, index) => (
                  <li key={index} className="flex justify-between items-center border-b py-2">
                    <span className="text-gray-700">{reporte.nombre}</span>
                    <a
                      href={reporte.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl md:rounded-xl p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl md:rounded-xl p-6 max-h-[90vh] overflow-y-auto relative modal-enter">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
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
