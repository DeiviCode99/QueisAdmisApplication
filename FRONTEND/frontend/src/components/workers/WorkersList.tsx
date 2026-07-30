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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar colaboradores..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 md:py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:outline-none"
          />
        </div>
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
            onClick={handleNewWorker}
            className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
          >
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No se encontraron colaboradores</div>
          ) : (
            <>
              <table className="w-full divide-y divide-gray-200 hidden md:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Celular</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkers.map(worker => (
                    <tr key={worker.id} className={`hover:bg-brand-50 transition-colors ${worker.activo === false ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">{worker.nombres} {worker.apellidos}</td>
                      <td className="px-6 py-4">{worker.tipo_documento} {worker.numero_documento}</td>
                      <td className="px-6 py-4">{worker.celular}</td>
                      <td className="px-6 py-4">
                        {worker.activo === false && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {worker.activo === false ? (
                            <button onClick={() => handleRestoreWorker(worker.id)} className="btn-icon text-emerald-600 hover:text-emerald-800 p-2 rounded hover:bg-emerald-50" title="Restaurar"><RotateCcw className="h-5 w-5" /></button>
                          ) : (
                            <>
                              <button onClick={() => handleEditWorker(worker)} className="btn-icon text-emerald-600 hover:text-emerald-800 p-2 rounded hover:bg-emerald-50" title="Editar"><Edit className="h-5 w-5" /></button>
                              <button onClick={() => confirmDisableWorker(worker)} className="btn-icon text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="block md:hidden divide-y divide-gray-200">
                {filteredWorkers.map(worker => (
                  <div key={worker.id} className={`p-4 hover:bg-brand-50 transition-colors ${worker.activo === false ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{worker.nombres} {worker.apellidos}</p>
                          {worker.activo === false && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{worker.tipo_documento} {worker.numero_documento}</p>
                        <p className="text-sm text-gray-500">{worker.celular}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {worker.activo === false ? (
                          <button onClick={() => handleRestoreWorker(worker.id)} className="btn-icon p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Restaurar"><RotateCcw className="h-5 w-5" /></button>
                        ) : (
                          <>
                            <button onClick={() => handleEditWorker(worker)} className="btn-icon p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => confirmDisableWorker(worker)} className="btn-icon p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-lg p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Deshabilitar Colaborador?</h3>
            <p className="text-sm text-gray-600 mb-6">
              El colaborador <strong>{workerToDisable?.nombres} {workerToDisable?.apellidos}</strong> quedará inactivo. Puedes restaurarlo después.
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
