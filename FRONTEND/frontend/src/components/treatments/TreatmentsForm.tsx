import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-toastify";

interface Treatment {
  id: number;
  nombre: string;
  duracion: number | string;
  descripcion: string;
  activo: boolean;
}

interface TreatmentsFormProps {
  treatment: Treatment | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

interface FormData {
  nombre: string;
  duracion: number | string;
  descripcion: string;
}

export default function TreatmentsForm({ treatment, onSave, onCancel }: TreatmentsFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    duracion: '',
    descripcion: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (treatment) {
      setFormData({
        nombre: treatment.nombre || '',
        duracion: treatment.duracion || '',
        descripcion: treatment.descripcion || ''
      });
    }
  }, [treatment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateNameField = (value: string, label: string): string | null => {
    const nameRe = /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/;
    const trimmed = value.trim();
    if (!trimmed) return `${label} es requerido`;
    if (!nameRe.test(trimmed)) return 'Solo se permiten letras y espacios';
    if (trimmed.length < 3) return `${label} debe tener al menos 3 caracteres`;
    const unique = new Set(trimmed.toLowerCase().replace(/\s/g, ''));
    if (unique.size < 2) return `${label} no puede consistir solo de caracteres repetidos`;
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nombreErr = validateNameField(formData.nombre, 'El nombre');
    if (nombreErr) newErrors.nombre = nombreErr;
    if (!formData.duracion) newErrors.duracion = 'La duración es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanedData: Record<string, unknown> = {
      nombre: formData.nombre.trim(),
      duracion: formData.duracion,
      descripcion: formData.descripcion.trim()
    };

    try {
      await onSave(cleanedData);
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors: Record<string, string> = {};
        Object.entries(data).forEach(([field, msg]) => {
          fieldErrors[field] = Array.isArray(msg) ? msg[0] : String(msg);
        });
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        toast.error("Corrige los errores marcados");
      } else {
        toast.error("Error al guardar tratamiento");
      }
      console.error("Error al guardar el tratamiento:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onCancel} className="btn-icon p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-[12px] transition-all duration-150">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-heading font-bold text-brand-800">{treatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h2>
      </div>

      <div className="clay-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-heading font-semibold text-brand-700 mb-4">Información del Tratamiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Nombre *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                className={`clay-input ${errors.nombre ? 'clay-input-error' : ''}`} />
              {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Duración (minutos) *</label>
              <select name="duracion" value={formData.duracion} onChange={handleChange}
                className={`clay-input ${errors.duracion ? 'clay-input-error' : ''}`}>
                <option value="">Seleccionar duración</option>
                {[15,30,45,60,75,90,105,120,135,150,165,180].map(min => (
                  <option key={min} value={min}>{min} minutos</option>
                ))}
              </select>
              {errors.duracion && <p className="text-sm text-red-500 mt-1">{errors.duracion}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3}
                className="clay-input" />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-brand-100">
            <button type="button" onClick={onCancel} className="clay-btn-secondary bg-white text-brand-600 border border-brand-200 px-4 py-2">Cancelar</button>
            <button type="submit" className="clay-btn bg-gradient-to-b from-brand-400 to-brand-500 text-white font-heading font-semibold px-4 py-2 flex items-center space-x-2">
              <Save className="h-4 w-4" /><span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
