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
        <h2 className="text-2xl font-heading font-bold text-brand-800">Tratamientos</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInactivos(!showInactivos)}
            className={`clay-btn-secondary px-3 py-2 flex items-center gap-1.5 text-sm transition-all duration-200 ${showInactivos ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter className="h-4 w-4" /> Inactivos
          </button>
          <button onClick={handleNew} className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex items-center gap-2">
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
          <button onClick={handleNew} className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white">Nuevo Tratamiento</button>
        } />
      ) : (
        <div className="clay-card overflow-hidden">
          <table className="w-full table-auto hidden md:table">
            <thead className="bg-brand-50/70 border-b border-brand-100/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-brand-600 uppercase">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-heading font-semibold text-brand-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-50">
              {paginatedTreatments.map((treatment) => (
                <tr key={treatment.id} className={`${!treatment.activo ? 'opacity-50' : ''} hover:bg-brand-50/30 transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-800">
                    {treatment.nombre}
                    {!treatment.activo && <span className="ml-2 clay-badge text-xs bg-red-50 text-red-700 border border-red-200">Inactivo</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">{treatment.duracion} min</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">{treatment.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(treatment)} className="btn-icon p-2 text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-[8px]"><Edit className="h-5 w-5" /></button>
                      {treatment.activo ? (
                        <button onClick={() => confirmDeleteTreatment(treatment)} className="btn-icon p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[8px]"><Ban className="h-5 w-5" /></button>
                      ) : (
                        <button onClick={() => handleRestore(treatment)} className="btn-icon p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-50 rounded-[8px]"><RotateCcw className="h-5 w-5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="block md:hidden divide-y divide-brand-50">
            {paginatedTreatments.map((treatment) => (
              <div key={treatment.id} className={`p-4 hover:bg-brand-50/30 transition-colors ${!treatment.activo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-800 text-sm">
                      {treatment.nombre}
                      {!treatment.activo && <span className="ml-2 clay-badge text-xs bg-red-50 text-red-700 border border-red-200">Inactivo</span>}
                    </p>
                    <p className="text-sm text-brand-500 mt-0.5">{treatment.duracion} min</p>
                    {treatment.descripcion && <p className="text-sm text-brand-400 truncate">{treatment.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEdit(treatment)} className="btn-icon p-2 text-brand-500 hover:bg-brand-50 rounded-[8px]" title="Editar"><Edit className="h-5 w-5" /></button>
                    {treatment.activo ? (
                      <button onClick={() => confirmDeleteTreatment(treatment)} className="btn-icon p-2 text-red-500 hover:bg-red-50 rounded-[8px]" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
                    ) : (
                      <button onClick={() => handleRestore(treatment)} className="btn-icon p-2 text-accent-500 hover:bg-accent-50 rounded-[8px]" title="Reactivar"><RotateCcw className="h-5 w-5" /></button>
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-md rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">¿Deshabilitar Tratamiento?</h3>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro de deshabilitar el tratamiento <strong>{treatmentToDelete?.nombre}</strong>? Podrás reactivarlo después.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="clay-btn-secondary px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200">Cancelar</button>
              <button onClick={handleDeleteConfirmed} className="clay-btn px-4 py-2 bg-gradient-to-b from-red-400 to-red-500 text-white">Deshabilitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
