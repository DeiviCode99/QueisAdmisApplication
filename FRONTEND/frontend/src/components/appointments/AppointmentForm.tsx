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
        <button onClick={onCancel} className="btn-icon p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {appointment ? (isReadOnly ? 'Ver Cita' : 'Editar Cita') : 'Nueva Cita'}
        </h2>
        {isReadOnly && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">Solo lectura</span>
        )}
        {isRETR && (
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">Atrasada — editable</span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="relative">
              <label className="block mb-1 text-sm font-medium text-gray-700">Paciente</label>
              <input
                type="text"
                placeholder="Buscar paciente por nombre..."
                value={query}
                onChange={handlePatientSearch}
                onFocus={() => setShowSuggestions(true)}
                readOnly={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg ${errors.paciente_id ? 'border-red-500' : 'border-gray-300'} ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.paciente_id && <p className="text-sm text-red-600">{errors.paciente_id}</p>}

              {showSuggestions && query && filteredPatients.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 mt-1 rounded-lg max-h-48 overflow-y-auto w-full shadow">
                  {filteredPatients.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => {
                        if (isReadOnly) return;
                        setFormData({ ...formData, paciente_id: p.id });
                        setQuery(`${p.nombres} ${p.apellidos}`);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-emerald-100"
                    >
                      {p.nombres} {p.apellidos}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Colaborador</label>
              <select
                name="colaborador_id"
                value={formData.colaborador_id}
                onChange={handleChange}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg ${errors.colaborador_id ? 'border-red-500' : 'border-gray-300'} ${isReadOnly ? 'bg-gray-100' : ''}`}
              >
                <option value="">Selecciona un colaborador</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nombres} {w.apellidos}
                  </option>
                ))}
              </select>
              {errors.colaborador_id && <p className="text-sm text-red-600">{errors.colaborador_id}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Servicio</label>
              <select
                name="servicio_id"
                value={formData.servicio_id}
                onChange={handleChange}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg ${errors.servicio_id ? 'border-red-500' : 'border-gray-300'} ${isReadOnly ? 'bg-gray-100' : ''}`}
              >
                <option value="">Selecciona un servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {errors.servicio_id && <p className="text-sm text-red-600">{errors.servicio_id}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Aperitivos</label>
              <div className="space-y-2">
                {snacks.map((snack) => (
                  <label key={snack.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.aperitivos.includes(snack.id)}
                      onChange={() => handleSnackToggle(snack.id)}
                      disabled={isReadOnly}
                      className="rounded border-gray-300"
                    />
                    <span>{snack.nombre} (${snack.precio})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Precio</label>
              <input
                type="text"
                name="saldo_pend"
                value={formData.saldo_pend}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                name="fecha_hora"
                value={formData.fecha_hora}
                onChange={handleChange}
                min={appointment ? undefined : todayStr}
                readOnly={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg ${errors.fecha_hora ? 'border-red-500' : 'border-gray-300'} ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.fecha_hora && <p className="text-sm text-red-600">{errors.fecha_hora}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Hora</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                readOnly={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg ${errors.hora ? 'border-red-500' : 'border-gray-300'} ${isReadOnly ? 'bg-gray-100' : ''}`}
              />
              {errors.hora && <p className="text-sm text-red-600">{errors.hora}</p>}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              readOnly={isReadOnly}
              className={`w-full px-3 py-2 border rounded-lg border-gray-300 ${isReadOnly ? 'bg-gray-100' : ''}`}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancelar
            </button>
            {!isReadOnly && (
              <button type="submit" className="btn px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center space-x-2">
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
