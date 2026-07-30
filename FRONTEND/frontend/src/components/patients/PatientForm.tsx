import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createPatient,
  updatePatient,
  getDocumentTypes,
  getLabelPat,
} from '../../lib/api';

const NAME_RE = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
const DIGITS_ONLY = /^\d*$/;

interface PatientFormData {
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  etiquetas_pac: string;
  numero_documento: string;
  celular: string;
  direccion: string;
  fecha_nacimiento: string;
  emergencia_nombre: string;
  emergencia_number: string;
  condiciones_medicas: string;
  alergias: string;
  extras: string[];
}

interface Patient {
  id?: number | string;
  nombres?: string;
  apellidos?: string;
  tipo_documento?: string;
  etiquetas_pac?: string;
  numero_documento?: string;
  celular?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  emergencia_nombre?: string;
  emergencia_number?: string;
  condiciones_medicas?: string;
  alergias?: string;
  extras?: string[];
}

interface PatientFormProps {
  patient?: Patient | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    nombres: '',
    apellidos: '',
    tipo_documento: '',
    etiquetas_pac: '',
    numero_documento: '',
    celular: '',
    direccion: '',
    fecha_nacimiento: '',
    emergencia_nombre: '',
    emergencia_number: '',
    condiciones_medicas: '',
    alergias: '',
    extras: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentTypes, setDocumentTypes] = useState<{ codigo: string; nombre: string }[]>([]);
  const [labelPatients, setLabelPatients] = useState<{ codigo: string; nombre: string }[]>([]);
  const [newExtra, setNewExtra] = useState('');

  useEffect(() => {
    if (patient) {
      setFormData({
        nombres: patient.nombres || '',
        apellidos: patient.apellidos || '',
        tipo_documento: patient.tipo_documento || '',
        etiquetas_pac: patient.etiquetas_pac || '',
        numero_documento: patient.numero_documento || '',
        celular: patient.celular || '',
        direccion: patient.direccion || '',
        fecha_nacimiento: patient.fecha_nacimiento || '',
        emergencia_nombre: patient.emergencia_nombre || '',
        emergencia_number: patient.emergencia_number || '',
        condiciones_medicas: patient.condiciones_medicas || '',
        alergias: patient.alergias || '',
        extras: Array.isArray(patient.extras) ? patient.extras : [],
      });
    }
  }, [patient]);

  useEffect(() => {
    getDocumentTypes()
      .then(data => setDocumentTypes(data as unknown as { codigo: string; nombre: string }[]))
      .catch((err) => {
        console.error('Error cargando tipos de documento:', err);
        toast.error('Error al cargar los datos');
      });

    getLabelPat()
      .then(data => setLabelPatients(data as unknown as { codigo: string; nombre: string }[]))
      .catch((err) => {
        console.error('Error cargando etiquetas:', err);
        toast.error('Error al cargar los datos');
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const validateName = (value: string, label: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) return `${label} es requerido`;
      if (!NAME_RE.test(trimmed)) return 'Solo se permiten letras y espacios';
      if (trimmed.length < 3) return `${label} debe tener al menos 3 caracteres`;
      const unique = new Set(trimmed.toLowerCase().replace(/\s/g, ''));
      if (unique.size < 2) return `${label} no puede consistir solo de caracteres repetidos`;
      return null;
    };

    const nombresErr = validateName(formData.nombres, 'El nombre');
    if (nombresErr) newErrors.nombres = nombresErr;

    const apellidosErr = validateName(formData.apellidos, 'El apellido');
    if (apellidosErr) newErrors.apellidos = apellidosErr;

    if (!formData.celular.trim()) newErrors.celular = 'El celular es requerido';
    else if (!DIGITS_ONLY.test(formData.celular)) newErrors.celular = 'Solo se permiten números';

    if (formData.numero_documento && !DIGITS_ONLY.test(formData.numero_documento)) {
      newErrors.numero_documento = 'Solo se permiten números';
    }
    if (formData.numero_documento && formData.numero_documento.length > 10) {
      newErrors.numero_documento = 'Máximo 10 dígitos';
    }

    if (formData.emergencia_number && !DIGITS_ONLY.test(formData.emergencia_number)) {
      newErrors.emergencia_number = 'Solo se permiten números';
    }

    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      if (birthDate > today) {
        newErrors.fecha_nacimiento = 'La fecha no puede ser futura';
      } else {
        const minAgeDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
        if (birthDate > minAgeDate) {
          newErrors.fecha_nacimiento = 'El paciente debe tener al menos 15 años';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload: Record<string, unknown> = {
        ...formData,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
      };

      if (patient?.id) {
        await updatePatient(patient.id, payload);
        toast.success("Paciente actualizado correctamente");
      } else {
        await createPatient(payload);
        toast.success("Paciente registrado correctamente");
      }
      if (onSave) onSave();
    } catch (error) {
      const data = (error as { response?: { data?: unknown } }).response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data as Record<string, unknown>).forEach(([field, msg]) => {
          fieldErrors[field] = Array.isArray(msg) ? msg[0] as string : msg as string;
        });
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        toast.error("Corrige los errores marcados en el formulario");
      } else {
        toast.error("Error al guardar el paciente");
      }
      console.error("Error al guardar el paciente:", error);
    }
  };

  const handleAddExtra = () => {
    if (newExtra.trim() === '') return;
    setFormData(prev => ({
      ...prev,
      extras: [...(prev.extras || []), newExtra.trim()]
    }));
    setNewExtra('');
  };

  const handleRemoveExtra = (index: number) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index)
    }));
  };

  const handleExtraKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddExtra();
    }
  };

  const getBgColorByEtiqueta = (code: string): string => {
    switch (code) {
      case 'NUV': return 'bg-yellow-50';
      case 'ANT': return 'bg-purple-200';
      case 'PPN': return 'bg-red-100';
      case 'JOD': return 'bg-sky-50';
      default: return 'bg-white';
    }
  };

  const maxBirthStr = new Date(new Date().getFullYear() - 15, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onCancel} className="btn-icon p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {patient ? 'Editar Paciente' : 'Nuevo Paciente'}
        </h2>
      </div>

      <div className={`${getBgColorByEtiqueta(formData.etiquetas_pac)} rounded-xl shadow-sm border border-gray-100 p-6`}>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                <input
                  type="text" name="nombres" value={formData.nombres} onChange={handleChange}
                  pattern="[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+"
                  title="Solo letras y espacios"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.nombres ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.nombres && <p className="text-sm text-red-600 mt-1">{errors.nombres}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                <input
                  type="text" name="apellidos" value={formData.apellidos} onChange={handleChange}
                  pattern="[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+"
                  title="Solo letras y espacios"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.apellidos ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.apellidos && <p className="text-sm text-red-600 mt-1">{errors.apellidos}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.tipo_documento ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Selecciona un tipo</option>
                  {documentTypes.map((tipo) => (
                    <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>
                  ))}
                </select>
                {errors.tipo_documento && <p className="text-sm text-red-600 mt-1">{errors.tipo_documento}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                <select name="etiquetas_pac" value={formData.etiquetas_pac} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecciona una etiqueta</option>
                  {labelPatients.map((tipo) => (
                    <option key={tipo.codigo} value={tipo.codigo}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
                <input
                  type="text" name="numero_documento" value={formData.numero_documento} onChange={handleChange}
                  maxLength={10} pattern="[0-9]*" inputMode="numeric"
                  title="Solo números, máximo 10 dígitos"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.numero_documento ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.numero_documento && <p className="text-sm text-red-600 mt-1">{errors.numero_documento}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange}
                  max={maxBirthStr}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.fecha_nacimiento && <p className="text-sm text-red-600 mt-1">{errors.fecha_nacimiento}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular *</label>
                <input
                  type="tel" name="celular" value={formData.celular} onChange={handleChange}
                  maxLength={10} pattern="[0-9]*" inputMode="numeric"
                  title="Solo números"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.celular ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.celular && <p className="text-sm text-red-600 mt-1">{errors.celular}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text" name="emergencia_nombre" value={formData.emergencia_nombre} onChange={handleChange}
                  pattern="[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+"
                  title="Solo letras y espacios"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input
                  type="tel" name="emergencia_number" value={formData.emergencia_number} onChange={handleChange}
                  maxLength={10} pattern="[0-9]*" inputMode="numeric"
                  title="Solo números"
                  className={`w-full px-3 py-2 border rounded-lg ${errors.emergencia_number ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.emergencia_number && <p className="text-sm text-red-600 mt-1">{errors.emergencia_number}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Médica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones Médicas</label>
                <textarea name="condiciones_medicas" value={formData.condiciones_medicas} onChange={handleChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                <textarea name="alergias" value={formData.alergias} onChange={handleChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extras</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text" value={newExtra} onChange={(e) => setNewExtra(e.target.value)}
                    onKeyDown={handleExtraKeyDown}
                    placeholder="Escribe una nota y presiona Enter o +"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button type="button" onClick={handleAddExtra}
                    className="btn px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {Array.isArray(formData.extras) && formData.extras.length > 0 && (
                  <ul className="space-y-2">
                    {formData.extras.map((extra, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 border px-3 py-2 rounded-lg">
                        <span>{extra}</span>
                        <button type="button" onClick={() => handleRemoveExtra(index)}
                          className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancelar
            </button>
            <button type="submit"
              className="btn px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
