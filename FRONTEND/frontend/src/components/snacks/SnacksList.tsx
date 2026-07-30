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
        <h2 className="text-xl font-bold">Aperitivos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactivos(!showInactivos)}
            className={`btn px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 text-sm ${
              showInactivos
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Inactivos</span>
          </button>
          <button
            className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 flex items-center gap-2"
            onClick={() => {
              setSelectedSnack(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-5 w-5" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border divide-y">
        {snacks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron aperitivos</div>
        ) : (
          snacks.map((snack) => (
            <div key={snack.id} className={`flex justify-between items-center p-4 hover:bg-brand-50 ${snack.activo === false ? 'opacity-50' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800">{snack.nombre}</h3>
                  {snack.activo === false && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">${snack.precio}</p>
              </div>
              <div className="flex items-center gap-2">
                {snack.activo === false ? (
                  <button onClick={() => handleRestore(snack.id)} className="btn-icon" title="Restaurar">
                    <RotateCcw className="text-emerald-600 hover:text-emerald-800" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleEdit(snack)} className="btn-icon" title="Editar">
                      <Edit className="text-emerald-600 hover:text-emerald-800" />
                    </button>
                    <button onClick={() => confirmDisable(snack)} className="btn-icon" title="Deshabilitar">
                      <Ban className="text-red-600 hover:text-red-800" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-lg p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Deshabilitar Aperitivo?</h3>
            <p className="text-sm text-gray-600 mb-6">
              El aperitivo <strong>{snackToDisable?.nombre}</strong> quedará inactivo. Puedes restaurarlo después.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDisableModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisableConfirmed}
                className="btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Deshabilitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
