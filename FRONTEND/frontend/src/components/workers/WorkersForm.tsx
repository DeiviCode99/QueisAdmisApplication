import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { getDocumentTypes2 } from "../../lib/api";
import { toast } from "react-toastify";

interface Worker {
  id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  celular: string;
  activo: boolean;
}

interface DocumentType {
  codigo: string;
  nombre: string;
}

interface WorkerFormProps {
  worker: Worker | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

interface FormData {
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  celular: string;
}

export default function WorkerForm({ worker, onSave, onCancel }: WorkerFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    tipo_documento: '',
    numero_documento: '',
    celular: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  useEffect(() => {
    if (worker) {
      setFormData({
        nombres: worker.nombres || '',
        apellidos: worker.apellidos || '',
        tipo_documento: worker.tipo_documento || '',
        numero_documento: worker.numero_documento || '',
        celular: worker.celular || ''
      });
    }
  }, [worker]);

  useEffect(() => {
    getDocumentTypes2()
      .then(data => setDocumentTypes(data as unknown as DocumentType[]))
      .catch((err) => {
        console.error('Error cargando tipos de documento:', err);
        toast.error('Error al cargar los datos');
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombres.trim()) newErrors.nombres = 'El nombre es requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'El apellido es requerido';
    if (!formData.tipo_documento.trim()) newErrors.tipo_documento = 'Seleccione tipo de documento';
    if (!formData.numero_documento.trim()) newErrors.numero_documento = 'Ingrese su número de documento';
    if (!formData.celular.trim()) newErrors.celular = 'El celular es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanedData: Record<string, unknown> = {
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      tipo_documento: formData.tipo_documento.trim(),
      numero_documento: formData.numero_documento.trim(),
      celular: formData.celular.trim(),
    };

    try {
      if (onSave) await onSave(cleanedData);
    } catch (error) {
      toast.error("Error al guardar al colaborador");
      console.error("Error al guardar el colaborador:", error);
      console.error("Detalles del error:", (error as { response?: { data?: unknown } }).response?.data || (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="btn-icon p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-[12px] transition-all duration-150"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-heading font-bold text-brand-800">
          {worker ? 'Editar Colaborador' : 'Nuevo Colaborador'}
        </h2>
      </div>

      <div className="clay-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-heading font-semibold text-brand-700">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Nombres *</label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                className={`clay-input ${errors.nombres ? 'clay-input-error' : ''}`}
              />
              {errors.nombres && <p className="text-sm text-red-500 mt-1">{errors.nombres}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Apellidos *</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className={`clay-input ${errors.apellidos ? 'clay-input-error' : ''}`}
              />
              {errors.apellidos && <p className="text-sm text-red-500 mt-1">{errors.apellidos}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Tipo de Documento *</label>
              <select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
                className={`clay-input ${errors.tipo_documento ? 'clay-input-error' : ''}`}
              >
                <option value="">Selecciona un tipo</option>
                {documentTypes.map((tipo) => (
                  <option key={tipo.codigo} value={tipo.codigo}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {errors.tipo_documento && <p className="text-sm text-red-500 mt-1">{errors.tipo_documento}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Número de Documento *</label>
              <input
                type="text"
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                className={`clay-input ${errors.numero_documento ? 'clay-input-error' : ''}`}
              />
              {errors.numero_documento && <p className="text-sm text-red-500 mt-1">{errors.numero_documento}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Celular *</label>
              <input
                type="text"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                className={`clay-input ${errors.celular ? 'clay-input-error' : ''}`}
              />
              {errors.celular && <p className="text-sm text-red-500 mt-1">{errors.celular}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-brand-100">
            <button
              type="button"
              onClick={onCancel}
              className="clay-btn-secondary bg-white text-brand-600 border border-brand-200 px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="clay-btn bg-gradient-to-b from-brand-400 to-brand-500 text-white font-heading font-semibold px-4 py-2 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
