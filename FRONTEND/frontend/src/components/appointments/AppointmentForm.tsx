import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getPatients,
  getWorkers,
  getServices,
  createAppointment,
  updateAppointment,
  getSnacks,
} from '../../lib/api';

interface Patient {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Worker {
  id: number;
  nombres: string;
  apellidos: string;
}

interface Service {
  id: number;
  nombre: string;
  precio: string;
}

interface Snack {
  id: number;
  nombre: string;
  precio: string;
}

interface AperitivoInfo {
  id: number;
}

interface Appointment {
  id?: number;
  estado?: string;
  paciente?: Patient;
  colaborador?: Worker;
  servicio?: Service;
  fecha_hora?: string;
  hora?: string;
  notas?: string;
  saldo_pend?: string;
  aperitivos_info?: AperitivoInfo[];
}

interface AppointmentFormData {
  paciente_id: number | string;
  colaborador_id: number | string;
  servicio_id: number | string;
  fecha_hora: string;
  hora: string;
  notas: string;
  saldo_pend: string;
  estado: string;
  aperitivos: number[];
}

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function AppointmentForm({ appointment, onSave, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    paciente_id: '',
    colaborador_id: '',
    servicio_id: '',
    fecha_hora: '',
    hora: '',
    notas: '',
    saldo_pend: '',
    estado: 'PEND',
    aperitivos: []
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [query, setQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isReadOnly = appointment?.estado === 'REAL' || appointment?.estado === 'CANC';
  const isRETR = appointment?.estado === 'RETR';

  useEffect(() => {
    loadData();

    if (appointment) {
      setFormData({
        paciente_id: appointment.paciente?.id || '',
        colaborador_id: appointment.colaborador?.id || '',
        servicio_id: appointment.servicio?.id || '',
        fecha_hora: appointment.fecha_hora || '',
        hora: appointment.hora || '',
        notas: appointment.notas || '',
        saldo_pend: appointment.saldo_pend || '',
        estado: appointment.estado || 'PEND',
        aperitivos: appointment.aperitivos_info?.map((s) => s.id) || []
      });

      if (appointment.paciente) {
        setQuery(`${appointment.paciente.nombres} ${appointment.paciente.apellidos}`);
      }
    }
  }, [appointment]);

  const loadData = async () => {
    try {
      const [pats, works, servs, snacksRes] = await Promise.all([
        getPatients(),
        getWorkers(),
        getServices(),
        getSnacks()
      ]);
      setPatients(pats as unknown as Patient[]);
      setWorkers(works as unknown as Worker[]);
      setServices(servs as unknown as Service[]);
      setSnacks(snacksRes as unknown as Snack[]);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  const handleSnackToggle = (snackId: number) => {
    if (isReadOnly) return;
    const alreadySelected = formData.aperitivos.includes(snackId);
    const newSelection = alreadySelected
      ? formData.aperitivos.filter(id => id !== snackId)
      : [...formData.aperitivos, snackId];

    const totalSnackPrice = snacks
      .filter(s => newSelection.includes(s.id))
      .reduce((sum, s) => sum + parseFloat(s.precio), 0);

    const servicioPrecio = parseFloat(
      services.find(s => s.id === parseInt(formData.servicio_id as string))?.precio || '0'
    );

    setFormData((prev) => ({
      ...prev,
      aperitivos: newSelection,
      saldo_pend: (servicioPrecio + totalSnackPrice).toFixed(2)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    const { name, value } = e.target;

    if (name === 'servicio_id') {
      const selectedService = services.find((s) => s.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        saldo_pend: selectedService ? selectedService.precio : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    const results = patients.filter((p) => {
      const fullName = `${p.nombres} ${p.apellidos}`.toLowerCase();
      return fullName.includes(value.toLowerCase());
    });

    setFilteredPatients(results);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.paciente_id) newErrors.paciente_id = 'Requerido';
    if (!formData.colaborador_id) newErrors.colaborador_id = 'Requerido';
    if (!formData.servicio_id) newErrors.servicio_id = 'Requerido';
    if (!formData.fecha_hora) newErrors.fecha_hora = 'Requerido';
    if (!formData.hora) newErrors.hora = 'Requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        aperitivos: formData.aperitivos
      };

      if (appointment?.id) {
        await updateAppointment(appointment.id, payload);
        toast.success("Cita actualizada correctamente");
      } else {
        await createAppointment({ ...payload, estado: 'PEND' });
        toast.success("Cita registrada correctamente");
      }
      if (onSave) onSave();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, unknown> } };
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data).forEach(([field, msg]) => {
          fieldErrors[field] = Array.isArray(msg) ? msg[0] : msg as string;
        });
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        toast.error("Corrige los errores marcados");
      } else {
        toast.error("Error al guardar cita");
      }
      console.error("Error al guardar cita:", err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onCancel} className="btn-icon p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-[12px] transition-all duration-150">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-heading font-bold text-brand-800">
          {appointment ? (isReadOnly ? 'Ver Cita' : 'Editar Cita') : 'Nueva Cita'}
        </h2>
        {isReadOnly && (
          <span className="clay-badge bg-amber-100 text-amber-700">Solo lectura</span>
        )}
        {isRETR && (
          <span className="clay-badge bg-orange-100 text-orange-700">Atrasada — editable</span>
        )}
      </div>

      <div className="clay-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="relative">
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Paciente</label>
              <input
                type="text"
                placeholder="Buscar paciente por nombre..."
                value={query}
                onChange={handlePatientSearch}
                onFocus={() => setShowSuggestions(true)}
                readOnly={isReadOnly}
                className={`clay-input ${errors.paciente_id ? 'clay-input-error' : ''} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {errors.paciente_id && <p className="text-sm text-red-500 mt-1">{errors.paciente_id}</p>}

              {showSuggestions && query && filteredPatients.length > 0 && (
                <ul className="absolute z-10 clay-card mt-2 max-h-48 overflow-y-auto w-full py-1">
                  {filteredPatients.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => {
                        if (isReadOnly) return;
                        setFormData({ ...formData, paciente_id: p.id });
                        setQuery(`${p.nombres} ${p.apellidos}`);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-2 cursor-pointer text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      {p.nombres} {p.apellidos}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Colaborador</label>
              <select
                name="colaborador_id"
                value={formData.colaborador_id}
                onChange={handleChange}
                disabled={isReadOnly}
                className={`clay-input ${errors.colaborador_id ? 'clay-input-error' : ''} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Selecciona un colaborador</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nombres} {w.apellidos}
                  </option>
                ))}
              </select>
              {errors.colaborador_id && <p className="text-sm text-red-500 mt-1">{errors.colaborador_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Servicio</label>
              <select
                name="servicio_id"
                value={formData.servicio_id}
                onChange={handleChange}
                disabled={isReadOnly}
                className={`clay-input ${errors.servicio_id ? 'clay-input-error' : ''} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Selecciona un servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {errors.servicio_id && <p className="text-sm text-red-500 mt-1">{errors.servicio_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Aperitivos</label>
              <div className="space-y-2">
                {snacks.map((snack) => (
                  <label key={snack.id} className={`flex items-center space-x-3 p-2 rounded-[10px] transition-colors ${formData.aperitivos.includes(snack.id) ? 'bg-brand-50' : 'hover:bg-brand-50/30'}`}>
                    <input
                      type="checkbox"
                      checked={formData.aperitivos.includes(snack.id)}
                      onChange={() => handleSnackToggle(snack.id)}
                      disabled={isReadOnly}
                      className="rounded border-brand-300 text-brand-500 focus:ring-brand-400"
                    />
                    <span className="text-brand-700 text-sm">{snack.nombre} (${snack.precio})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Precio</label>
              <input
                type="text"
                name="saldo_pend"
                value={formData.saldo_pend}
                readOnly
                className="clay-input opacity-60 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Fecha</label>
              <input
                type="date"
                name="fecha_hora"
                value={formData.fecha_hora}
                onChange={handleChange}
                min={appointment ? undefined : todayStr}
                readOnly={isReadOnly}
                className={`clay-input ${errors.fecha_hora ? 'clay-input-error' : ''} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {errors.fecha_hora && <p className="text-sm text-red-500 mt-1">{errors.fecha_hora}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`clay-input ${errors.hora ? 'clay-input-error' : ''} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {errors.hora && <p className="text-sm text-red-500 mt-1">{errors.hora}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-700 mb-1.5">Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              readOnly={isReadOnly}
              className={`clay-input ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-brand-100">
            <button type="button" onClick={onCancel} className="clay-btn-secondary bg-white text-brand-600 border border-brand-200 px-4 py-2">
              Cancelar
            </button>
            {!isReadOnly && (
              <button type="submit" className="clay-btn bg-gradient-to-b from-brand-400 to-brand-500 text-white font-heading font-semibold px-4 py-2 flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Guardar</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
