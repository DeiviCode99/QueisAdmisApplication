import { useState, useEffect } from 'react';
import { Search, Plus, Edit, RotateCcw, Ban, Filter } from 'lucide-react';
import { getWorkers, createWorker, updateWorker, deleteWorker, restoreWorker } from '../../lib/api';
import WorkersForm from './WorkersForm';
import Skeleton from '../ui/Skeleton';
import { toast } from 'react-toastify';

interface Worker {
  id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  celular: string;
  activo: boolean;
}

export default function WorkerList() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivos, setShowInactivos] = useState(false);
  const [workerToDisable, setWorkerToDisable] = useState<Worker | null>(null);
  const [showDisableModal, setShowDisableModal] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, [showInactivos]);

  useEffect(() => {
    const filtered = workers.filter(worker =>
      `${worker.nombres} ${worker.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.numero_documento.includes(searchTerm) ||
      worker.celular.includes(searchTerm)
    );
    setFilteredWorkers(filtered);
  }, [searchTerm, workers]);

  const loadWorkers = async () => {
    try {
      const data = await getWorkers(showInactivos);
      setWorkers(data as unknown as Worker[]);
    } catch (error) {
      console.error('Error cargando colaboradores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorker = async (workerData: Record<string, unknown>) => {
    try {
      if (selectedWorker) {
        await updateWorker(selectedWorker.id, workerData);
      } else {
        await createWorker(workerData);
      }
      await loadWorkers();
      setShowForm(false);
      setSelectedWorker(null);
    } catch (error) {
      console.error('Error guardando colaborador:', error);
      console.error("Detalles del error:", (error as { response?: { data?: unknown } }).response?.data || (error as Error).message);
    }
  };

  const confirmDisableWorker = (worker: Worker) => {
    setWorkerToDisable(worker);
    setShowDisableModal(true);
  };

  const handleDisableConfirmed = async () => {
    try {
      if (!workerToDisable) return;
      await deleteWorker(workerToDisable.id);
      toast.success("Colaborador deshabilitado correctamente");
      setShowDisableModal(false);
      setWorkerToDisable(null);
      await loadWorkers();
    } catch (error) {
      toast.error("Error al deshabilitar colaborador");
      console.error("Error al deshabilitar colaborador:", error);
    }
  };

  const handleRestoreWorker = async (id: number) => {
    try {
      await restoreWorker(id);
      toast.success("Colaborador restaurado correctamente");
      await loadWorkers();
    } catch (error) {
      toast.error("Error al restaurar colaborador");
    }
  };

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowForm(true);
  };

  const handleNewWorker = () => {
    setSelectedWorker(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <WorkersForm
        worker={selectedWorker}
        onSave={handleSaveWorker}
        onCancel={() => {
          setShowForm(false);
          setSelectedWorker(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-300 h-5 w-5" />
          <input
            type="text" placeholder="Buscar colaboradores..." value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="clay-input pl-10 pr-4 py-2.5 md:py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactivos(!showInactivos)}
            className={`clay-btn-secondary px-3 py-2 flex items-center gap-2 text-sm transition-all duration-200 ${showInactivos ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter className="h-4 w-4" />
            <span>Inactivos</span>
          </button>
          <button onClick={handleNewWorker} className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-full" count={5} />
        </div>
      ) : (
        <div className="clay-card overflow-hidden">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-12 text-brand-500">No se encontraron colaboradores</div>
          ) : (
            <>
              <table className="w-full divide-y divide-brand-50 hidden md:table">
                <thead className="bg-brand-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Celular</th>
                    <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-heading font-semibold text-brand-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-50">
                  {filteredWorkers.map(worker => (
                    <tr key={worker.id} className={`hover:bg-brand-50/50 transition-colors ${worker.activo === false ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-brand-800">{worker.nombres} {worker.apellidos}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-500">{worker.tipo_documento} {worker.numero_documento}</td>
                      <td className="px-6 py-4 text-sm text-brand-500">{worker.celular}</td>
                      <td className="px-6 py-4">
                        {worker.activo === false && (
                          <span className="clay-badge text-xs bg-gray-100 text-gray-600 border border-gray-200">Inactivo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {worker.activo === false ? (
                            <button onClick={() => handleRestoreWorker(worker.id)} className="btn-icon p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-50 rounded-[8px]" title="Restaurar"><RotateCcw className="h-5 w-5" /></button>
                          ) : (
                            <>
                              <button onClick={() => handleEditWorker(worker)} className="btn-icon p-2 text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-[8px]" title="Editar"><Edit className="h-5 w-5" /></button>
                              <button onClick={() => confirmDisableWorker(worker)} className="btn-icon p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[8px]" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="block md:hidden divide-y divide-brand-50">
                {filteredWorkers.map(worker => (
                  <div key={worker.id} className={`p-4 hover:bg-brand-50/50 transition-colors ${worker.activo === false ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-brand-800 text-sm">{worker.nombres} {worker.apellidos}</p>
                          {worker.activo === false && (
                            <span className="clay-badge text-xs bg-gray-100 text-gray-600 border border-gray-200">Inactivo</span>
                          )}
                        </div>
                        <p className="text-sm text-brand-500 mt-0.5">{worker.tipo_documento} {worker.numero_documento}</p>
                        <p className="text-sm text-brand-500">{worker.celular}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {worker.activo === false ? (
                          <button onClick={() => handleRestoreWorker(worker.id)} className="btn-icon p-2 text-accent-500 hover:bg-accent-50 rounded-[8px]" title="Restaurar"><RotateCcw className="h-5 w-5" /></button>
                        ) : (
                          <>
                            <button onClick={() => handleEditWorker(worker)} className="btn-icon p-2 text-brand-500 hover:bg-brand-50 rounded-[8px]" title="Editar"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => confirmDisableWorker(worker)} className="btn-icon p-2 text-red-500 hover:bg-red-50 rounded-[8px]" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showDisableModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-md rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">¿Deshabilitar Colaborador?</h3>
            <p className="text-sm text-gray-600 mb-6">
              El colaborador <strong>{workerToDisable?.nombres} {workerToDisable?.apellidos}</strong> quedará inactivo. Puedes restaurarlo después.
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
