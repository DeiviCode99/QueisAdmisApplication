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
        <button onClick={onCancel} className="btn-icon p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{service ? "Editar Servicio" : "Nuevo Servicio"}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.nombre && <p className="text-sm text-red-600">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input type="number" name="precio" value={formData.precio} onChange={handleChange} step="0.01"
                className={`w-full px-3 py-2 border rounded-lg ${errors.precio ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.precio && <p className="text-sm text-red-600">{errors.precio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
              <input type="number" name="duracion" value={formData.duracion} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 border-gray-300" />
              <p className="text-xs text-gray-500 mt-1">Calculada automáticamente de los tratamientos seleccionados</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tratamientos</label>
              {errors.tratamientos && <p className="text-sm text-red-600 mb-1">{errors.tratamientos}</p>}
              <button type="button" onClick={() => setShowTreatmentSelector(true)} className="mb-2 text-sm text-emerald-600 hover:underline">
                Ver lista de tratamientos
              </button>
              {formData.tratamientos.length > 0 && (
                <div className="space-y-2">
                  {formData.tratamientos.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                      <span>{t.nombre}</span>
                      <button type="button" onClick={() => removeTreatment(t.id)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showTreatmentSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
              <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-lg p-6 max-h-[90vh] overflow-y-auto space-y-4 modal-enter">
                <h3 className="text-lg font-semibold">Selecciona tratamientos</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allTreatments.map((t) => (
                    <label key={t.id} className="flex items-center space-x-2">
                      <input type="checkbox" checked={selectedTreatmentIds.includes(t.id)} onChange={() => toggleTreatment(t.id)} />
                      <span>{t.nombre}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowTreatmentSelector(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                  <button type="button" onClick={applyTreatments} className="btn px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg">Aceptar</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button type="submit" className="btn px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center space-x-2">
              <Save className="h-4 w-4" /><span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
