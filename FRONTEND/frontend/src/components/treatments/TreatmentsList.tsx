import { useEffect, useState } from 'react';
import { Plus, Edit, Ban, RotateCcw, Filter } from 'lucide-react';
import { getTreatments, createTreatment, updateTreatment, deleteTreatment, restoreTreatment } from '../../lib/api';
import TreatmentsForm from './TreatmentsForm';
import Skeleton from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 10;

interface Treatment {
  id: number;
  nombre: string;
  duracion: number;
  descripcion: string;
  activo: boolean;
}

export default function TreatmentsList() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [treatmentToDelete, setTreatmentToDelete] = useState<Treatment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactivos, setShowInactivos] = useState(false);

  useEffect(() => {
    loadTreatments();
  }, [showInactivos]);

  const loadTreatments = async () => {
    try {
      const data = await getTreatments(showInactivos);
      setTreatments(data as unknown as Treatment[]);
    } catch (error) {
      console.error('Error cargando tratamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedTreatment(null);
    setShowForm(true);
  };

  const handleEdit = (treatment: Treatment) => {
    if (!treatment.activo) {
      toast.info('Rehabilita el tratamiento antes de editarlo');
      return;
    }
    setSelectedTreatment(treatment);
    setShowForm(true);
  };

  const confirmDeleteTreatment = (treatment: Treatment) => {
    setTreatmentToDelete(treatment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      if (!treatmentToDelete) return;
      await deleteTreatment(treatmentToDelete.id);
      toast.success('Tratamiento deshabilitado correctamente');
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
      await loadTreatments();
    } catch (error) {
      toast.error("Error al deshabilitar tratamiento");
      console.error("Error:", error);
    }
  };

  const handleRestore = async (treatment: Treatment) => {
    try {
      await restoreTreatment(treatment.id);
      toast.success('Tratamiento reactivado correctamente');
      await loadTreatments();
    } catch (error) {
      toast.error('Error al reactivar tratamiento');
    }
  };

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (selectedTreatment) {
        await updateTreatment(selectedTreatment.id, data);
        toast.success("Tratamiento actualizado correctamente");
      } else {
        await createTreatment(data);
        toast.success("Tratamiento registrado correctamente");
      }
      setShowForm(false);
      setSelectedTreatment(null);
      await loadTreatments();
    } catch (error) {
      console.error('Error guardando tratamiento:', error);
      throw error;
    }
  };

  if (showForm) {
    return (
      <TreatmentsForm
        treatment={selectedTreatment}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setSelectedTreatment(null); }}
      />
    );
  }

  const totalPages = Math.ceil(treatments.length / ITEMS_PER_PAGE);
  const paginatedTreatments = treatments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Tratamientos</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInactivos(!showInactivos)}
            className={`btn px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm transition-colors ${showInactivos ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter className="h-4 w-4" /> Inactivos
          </button>
          <button onClick={handleNew} className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>Nuevo Tratamiento</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-full" count={5} />
        </div>
      ) : treatments.length === 0 ? (
        <EmptyState icon={Plus} title="No hay tratamientos registrados" description="Crea un nuevo tratamiento para comenzar" action={
          <button onClick={handleNew} className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">Nuevo Tratamiento</button>
        } />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full table-auto hidden md:table">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTreatments.map((treatment) => (
                <tr key={treatment.id} className={`${!treatment.activo ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {treatment.nombre}
                    {!treatment.activo && <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Inactivo</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{treatment.duracion} min</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{treatment.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(treatment)} className="btn-icon text-emerald-600 hover:text-emerald-900 p-2"><Edit className="h-5 w-5" /></button>
                    {treatment.activo ? (
                      <button onClick={() => confirmDeleteTreatment(treatment)} className="btn-icon text-red-600 hover:text-red-900 p-2"><Ban className="h-5 w-5" /></button>
                    ) : (
                      <button onClick={() => handleRestore(treatment)} className="btn-icon text-emerald-600 hover:text-emerald-900 p-2"><RotateCcw className="h-5 w-5" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="block md:hidden divide-y divide-gray-200">
            {paginatedTreatments.map((treatment) => (
              <div key={treatment.id} className={`p-4 hover:bg-brand-50 transition-colors ${!treatment.activo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {treatment.nombre}
                      {!treatment.activo && <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Inactivo</span>}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{treatment.duracion} min</p>
                    {treatment.descripcion && <p className="text-sm text-gray-500 truncate">{treatment.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEdit(treatment)} className="btn-icon p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar"><Edit className="h-5 w-5" /></button>
                    {treatment.activo ? (
                      <button onClick={() => confirmDeleteTreatment(treatment)} className="btn-icon p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
                    ) : (
                      <button onClick={() => handleRestore(treatment)} className="btn-icon p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Reactivar"><RotateCcw className="h-5 w-5" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-lg p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Deshabilitar Tratamiento?</h3>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro de deshabilitar el tratamiento <strong>{treatmentToDelete?.nombre}</strong>? Podrás reactivarlo después.</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancelar</button>
              <button onClick={handleDeleteConfirmed} className="btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Deshabilitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
