import { useEffect, useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { createSnack, updateSnack } from '../../lib/api';

interface Snack {
  id: number;
  nombre: string;
  precio: number | string;
  activo: boolean;
}

interface SnacksFormProps {
  snack: Snack | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  nombre: string;
  precio: number | string;
}

export default function SnacksForm({ snack, onSave, onCancel }: SnacksFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    precio: ''
  });

  useEffect(() => {
    if (snack) {
      setFormData({
        nombre: snack.nombre || '',
        precio: snack.precio || ''
      });
    }
  }, [snack]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (snack?.id) {
        await updateSnack(snack.id, formData as unknown as Record<string, unknown>);
        toast.success('Aperitivo actualizado');
      } else {
        await createSnack(formData as unknown as Record<string, unknown>);
        toast.success('Aperitivo creado');
      }
      if (onSave) onSave();
    } catch (error) {
      toast.error('Error al guardar');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="btn-icon p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-[12px] transition-all duration-150">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-heading font-bold text-brand-800">{snack ? 'Editar Aperitivo' : 'Nuevo Aperitivo'}</h2>
      </div>

      <div className="clay-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Nombre</label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="clay-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Precio (COP)</label>
              <input
                name="precio"
                type="number"
                value={formData.precio}
                onChange={handleChange}
                className="clay-input"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6 border-t border-brand-100">
            <button type="button" onClick={onCancel} className="clay-btn-secondary bg-white text-brand-600 border border-brand-200 px-4 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              className="clay-btn bg-gradient-to-b from-brand-400 to-brand-500 text-white font-heading font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
