import { useState, useEffect } from 'react';
import { Edit, Ban, RotateCcw, Plus, Filter } from 'lucide-react';
import { getSnacks, deleteSnack, restoreSnack } from '../../lib/api';
import SnacksForm from './SnacksForm';
import { toast } from 'react-toastify';

interface Snack {
  id: number;
  nombre: string;
  precio: number | string;
  activo: boolean;
}

export default function SnacksList() {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [selectedSnack, setSelectedSnack] = useState<Snack | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [snackToDisable, setSnackToDisable] = useState<Snack | null>(null);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showInactivos, setShowInactivos] = useState(false);

  useEffect(() => {
    loadSnacks();
  }, [showInactivos]);

  const loadSnacks = async () => {
    try {
      const data = await getSnacks(showInactivos);
      setSnacks(data as unknown as Snack[]);
    } catch (err) {
      console.error('Error cargando aperitivos:', err);
    }
  };

  const handleEdit = (snack: Snack) => {
    setSelectedSnack(snack);
    setShowForm(true);
  };

  const confirmDisable = (snack: Snack) => {
    setSnackToDisable(snack);
    setShowDisableModal(true);
  };

  const handleDisableConfirmed = async () => {
    try {
      if (!snackToDisable) return;
      await deleteSnack(snackToDisable.id);
      toast.success('Aperitivo deshabilitado correctamente');
      setSnackToDisable(null);
      setShowDisableModal(false);
      loadSnacks();
    } catch (err) {
      toast.error('Error al deshabilitar aperitivo');
      console.error(err);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreSnack(id);
      toast.success('Aperitivo restaurado correctamente');
      loadSnacks();
    } catch (err) {
      toast.error('Error al restaurar aperitivo');
    }
  };

  if (showForm) {
    return (
      <SnacksForm
        snack={selectedSnack}
        onSave={() => {
          setShowForm(false);
          setSelectedSnack(null);
          loadSnacks();
        }}
        onCancel={() => {
          setShowForm(false);
          setSelectedSnack(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold text-brand-800">Aperitivos</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInactivos(!showInactivos)}
            className={`clay-btn-secondary px-3 py-2 flex items-center gap-2 text-sm transition-all duration-200 ${showInactivos ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter className="h-4 w-4" />
            <span>Inactivos</span>
          </button>
          <button className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex items-center gap-2"
            onClick={() => { setSelectedSnack(null); setShowForm(true); }}>
            <Plus className="h-5 w-5" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="clay-card divide-y divide-brand-50">
        {snacks.length === 0 ? (
          <div className="text-center py-12 text-brand-500">No se encontraron aperitivos</div>
        ) : (
          snacks.map((snack) => (
            <div key={snack.id} className={`flex justify-between items-center p-4 hover:bg-brand-50/30 transition-colors ${snack.activo === false ? 'opacity-50' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-brand-800 text-sm">{snack.nombre}</h3>
                  {snack.activo === false && (
                    <span className="clay-badge text-xs bg-gray-100 text-gray-600 border border-gray-200">Inactivo</span>
                  )}
                </div>
                <p className="text-sm text-brand-500 mt-0.5">${snack.precio}</p>
              </div>
              <div className="flex items-center gap-1">
                {snack.activo === false ? (
                  <button onClick={() => handleRestore(snack.id)} className="btn-icon p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-50 rounded-[8px]" title="Restaurar">
                    <RotateCcw className="h-5 w-5" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleEdit(snack)} className="btn-icon p-2 text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-[8px]" title="Editar">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => confirmDisable(snack)} className="btn-icon p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[8px]" title="Deshabilitar">
                      <Ban className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showDisableModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-md rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">¿Deshabilitar Aperitivo?</h3>
            <p className="text-sm text-gray-600 mb-6">
              El aperitivo <strong>{snackToDisable?.nombre}</strong> quedará inactivo. Puedes restaurarlo después.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDisableModal(false)} className="clay-btn-secondary px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200">Cancelar</button>
              <button onClick={handleDisableConfirmed} className="clay-btn px-4 py-2 bg-gradient-to-b from-red-400 to-red-500 text-white">Deshabilitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
