import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import { getAppointments, updateAppointment, getAppointmentStatuses } from '../../lib/api';
import AppointmentForm from './AppointmentForm';
import Skeleton from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Colaborador {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Servicio {
  id: number;
  nombre: string;
  precio: string;
}

interface Snack {
  id: number;
}

interface Appointment {
  id: number;
  paciente?: Paciente;
  colaborador?: Colaborador;
  servicio?: Servicio;
  aperitivos?: Snack[];
  fecha_hora: string;
  hora: string;
  estado: string;
  notas?: string;
  saldo_pend: string;
}

interface AppointmentStatus {
  value: string;
  label: string;
}

const STATUS_COLORS: Record<string, string> = {
  PEND: 'bg-yellow-100 text-yellow-800',
  REAL: 'bg-emerald-100 text-emerald-800',
  CANC: 'bg-red-100 text-red-800',
  RETR: 'bg-orange-100 text-orange-800',
};

const ITEMS_PER_PAGE = 10;

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appointmentStatuses, setAppointmentStatuses] = useState<AppointmentStatus[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadAppointments();
    loadStatuses();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedDate, statusFilter]);

  const loadAppointments = async (): Promise<void> => {
    try {
      const data = await getAppointments();
      setAppointments(data as unknown as Appointment[]);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatuses = async (): Promise<void> => {
    try {
      const data = await getAppointmentStatuses();
      setAppointmentStatuses(data as unknown as AppointmentStatus[]);
    } catch (error) {
      console.error('Error cargando estados:', error);
    }
  };

  const filterAppointments = (): void => {
    let filtered: Appointment[] = [...appointments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(appt => appt.estado === statusFilter);
    }

    if (selectedDate?.trim()) {
      filtered = filtered.filter(appt => appt.fecha_hora === selectedDate);
    }

    const estadoOrden: Record<string, number> = { 'PEND': 0, 'REAL': 1, 'CANC': 2 };
    filtered.sort((a, b) => (estadoOrden[a.estado] ?? 99) - (estadoOrden[b.estado] ?? 99));

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  };

  const handleSaveAppointment = async (): Promise<void> => {
    await loadAppointments();
    setShowForm(false);
    setSelectedAppointment(null);
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: string): Promise<void> => {
    try {
      await updateAppointment(appointment.id, {
        paciente_id: appointment.paciente?.id,
        colaborador_id: appointment.colaborador?.id,
        servicio_id: appointment.servicio?.id,
        aperitivos: appointment.aperitivos?.map(s => s.id) || [],
        fecha_hora: appointment.fecha_hora,
        hora: appointment.hora,
        estado: newStatus,
        notas: appointment.notas,
        saldo_pend: appointment.saldo_pend
      });
      toast.success("Estado actualizado");
      await loadAppointments();
    } catch (error) {
      toast.error("Error al actualizar estado");
      console.error('Error actualizando estado:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment): void => {
    if (appointment.estado === 'REAL') {
      toast.info("No se puede editar una cita realizada");
      return;
    }
    if (appointment.estado === 'CANC') {
      toast.info("No se puede editar una cita cancelada");
      return;
    }
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const handleNewAppointment = (): void => {
    setSelectedAppointment(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <AppointmentForm
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
        onCancel={() => {
          setShowForm(false);
          setSelectedAppointment(null);
        }}
      />
    );
  }

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4 items-center">
            <input type="date" value={selectedDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)} className="border px-3 py-2 rounded-lg" />
            <select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)} className="border px-3 py-2 rounded-lg">
              <option value="all">Todos</option>
              {appointmentStatuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleNewAppointment} className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="h-5 w-5" /> Nueva Cita
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-full" count={5} />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No hay citas registradas" description="Crea una nueva cita para comenzar" action={
          <button onClick={handleNewAppointment} className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">Nueva Cita</button>
        } />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y max-h-[calc(100vh-220px)] overflow-y-auto">
            {paginatedAppointments.map((appt) => (
              <div key={appt.id} className="p-4 flex justify-between items-center hover:bg-brand-50">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-gray-800">{appt.paciente?.nombres} {appt.paciente?.apellidos}</h3>
                  <p className="text-sm text-gray-600">{appt.servicio?.nombre || 'Servicio'}</p>
                  <div className="text-sm text-gray-600 flex items-center gap-3">
                    <Calendar className="h-4 w-4" /> {appt.fecha_hora}
                    <Clock className="h-4 w-4" /> {appt.hora}
                  </div>
                  {appt.notas && <p className="text-sm mt-1 text-gray-500 bg-gray-50 p-2 rounded">{appt.notas}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[appt.estado] || 'bg-gray-100 text-gray-800'}`}>
                    {appointmentStatuses.find(s => s.value === appt.estado)?.label || appt.estado}
                  </span>
                  {(appt.estado === 'PEND' || appt.estado === 'RETR') && (
                    <>
                      <button onClick={() => handleStatusChange(appt, 'REAL')} className="btn-icon" title="Marcar como realizada">
                        <CheckCircle className="text-green-600 hover:text-green-800" />
                      </button>
                      <button onClick={() => handleStatusChange(appt, 'CANC')} className="btn-icon" title="Cancelar">
                        <XCircle className="text-red-600 hover:text-red-800" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEditAppointment(appt)}
                    className="btn-icon"
                    title={appt.estado === 'PEND' || appt.estado === 'RETR' ? 'Editar' : 'No editable'}
                  >
                    <Edit className={`${appt.estado === 'PEND' || appt.estado === 'RETR' ? 'text-emerald-600 hover:text-emerald-800' : 'text-gray-400 cursor-not-allowed'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
