import { useEffect, useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { getTreatments, createService, updateService } from "../../lib/api";
import { toast } from "react-toastify";

interface Treatment {
  id: number;
  nombre: string;
  duracion: number;
}

interface Service {
  id: number;
  nombre: string;
  duracion: number | string;
  precio: number | string;
  tratamientos: { id: number; nombre: string }[];
  activo: boolean;
}

interface ServicesFormProps {
  service: Service | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  nombre: string;
  duracion: number | string;
  precio: number | string;
  tratamientos: { id: number; nombre: string }[];
}

export default function ServicesForm({ service, onSave, onCancel }: ServicesFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    duracion: '',
    precio: '',
    tratamientos: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [showTreatmentSelector, setShowTreatmentSelector] = useState(false);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<number[]>([]);

  useEffect(() => {
    getTreatments()
      .then(data => setAllTreatments(data as unknown as Treatment[]))
      .catch((err) => {
        console.error('Error cargando tratamientos:', err);
        toast.error('Error al cargar los datos');
      });
  }, []);

  useEffect(() => {
    if (service) {
      setFormData({
        nombre: service.nombre || '',
        duracion: service.duracion || '',
        precio: service.precio || '',
        tratamientos: service.tratamientos || []
      });
      setSelectedTreatmentIds(service.tratamientos?.map(t => t.id) || []);
    }
  }, [service]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (selectedTreatmentIds.length === 0) newErrors.tratamientos = 'Selecciona al menos un tratamiento';
    if (!formData.precio) newErrors.precio = 'El precio es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleTreatment = (id: number) => {
    setSelectedTreatmentIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const calcTotalDuration = (ids: number[]): number => {
    return allTreatments.filter(t => ids.includes(t.id)).reduce((sum, t) => sum + (t.duracion || 0), 0);
  };

  const applyTreatments = () => {
    const totalDuracion = calcTotalDuration(selectedTreatmentIds);
    setFormData(prev => ({
      ...prev,
      tratamientos: allTreatments.filter(t => selectedTreatmentIds.includes(t.id)),
      duracion: totalDuracion || prev.duracion
    }));
    setShowTreatmentSelector(false);
  };

  const removeTreatment = (id: number) => {
    const newIds = selectedTreatmentIds.filter(t => t !== id);
    setSelectedTreatmentIds(newIds);
    const totalDuracion = calcTotalDuration(newIds);
    setFormData(prev => ({
      ...prev,
      tratamientos: prev.tratamientos.filter(t => t.id !== id),
      duracion: totalDuracion || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: Record<string, unknown> = {
      ...formData,
      tratamientos_ids: selectedTreatmentIds
    };
    delete payload.tratamientos;

    try {
      if (service?.id) {
        await updateService(service.id, payload);
        toast.success("Servicio actualizado correctamente");
      } else {
        await createService(payload);
        toast.success("Servicio registrado correctamente");
      }
      if (onSave) onSave();
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
        toast.error("Error al guardar el servicio");
      }
      console.error("Error al guardar el servicio:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onCancel} className="btn-icon p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-[12px] transition-all duration-150">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-heading font-bold text-brand-800">{service ? "Editar Servicio" : "Nuevo Servicio"}</h2>
      </div>

      <div className="clay-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Nombre del Servicio *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                className={`clay-input ${errors.nombre ? 'clay-input-error' : ''}`} />
              {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Precio *</label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} step="0.01"
                className={`clay-input ${errors.precio ? 'clay-input-error' : ''}`} />
              {errors.precio && <p className="text-sm text-red-500 mt-1">{errors.precio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Duración (minutos)</label>
              <input type="number" name="duracion" value={formData.duracion} readOnly
                className="clay-input opacity-60 cursor-not-allowed" />
              <p className="text-xs text-brand-400 mt-1">Calculada automáticamente de los tratamientos seleccionados</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Tratamientos</label>
              {errors.tratamientos && <p className="text-sm text-red-500 mb-1">{errors.tratamientos}</p>}
              <button type="button" onClick={() => setShowTreatmentSelector(true)} className="mb-2 text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors">
                Ver lista de tratamientos
              </button>
              {formData.tratamientos.length > 0 && (
                <div className="space-y-2">
                  {formData.tratamientos.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-brand-50/50 border border-brand-100/50 p-2.5 rounded-[12px]">
                      <span className="text-brand-700 text-sm">{t.nombre}</span>
                      <button type="button" onClick={() => removeTreatment(t.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showTreatmentSelector && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
              <div className="clay-card w-full max-w-md rounded-t-[20px] md:rounded-[20px] p-6 max-h-[90vh] overflow-y-auto space-y-4 modal-enter">
                <h3 className="text-lg font-heading font-semibold text-brand-800">Selecciona tratamientos</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allTreatments.map((t) => (
                    <label key={t.id} className={`flex items-center space-x-3 p-2 rounded-[10px] transition-colors ${selectedTreatmentIds.includes(t.id) ? 'bg-brand-50' : 'hover:bg-brand-50/30'}`}>
                      <input type="checkbox" checked={selectedTreatmentIds.includes(t.id)} onChange={() => toggleTreatment(t.id)}
                        className="rounded border-brand-300 text-brand-500 focus:ring-brand-400" />
                      <span className="text-brand-700">{t.nombre}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-brand-100">
                  <button type="button" onClick={() => setShowTreatmentSelector(false)} className="clay-btn-secondary bg-white text-brand-600 border border-brand-200 px-4 py-2">Cancelar</button>
                  <button type="button" onClick={applyTreatments} className="clay-btn bg-gradient-to-b from-brand-400 to-brand-500 text-white font-heading font-semibold px-4 py-2">Aceptar</button>
                </div>
              </div>
            </div>
          )}

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
