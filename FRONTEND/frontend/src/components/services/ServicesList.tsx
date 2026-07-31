import { useEffect, useState } from "react";
import { Plus, Edit, Ban, RotateCcw, Filter } from "lucide-react";
import { getServices, deleteService, restoreService } from "../../lib/api";
import ServicesForm from "./ServicesForm";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 10;

interface Service {
  id: number;
  nombre: string;
  duracion: number;
  precio: number | string;
  activo: boolean;
  tratamientos: { id: number; nombre: string }[];
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactivos, setShowInactivos] = useState(false);

  useEffect(() => {
    loadServices();
  }, [showInactivos]);

  const loadServices = async () => {
    try {
      const data = await getServices(showInactivos);
      setServices(data as unknown as Service[]);
    } catch (error) {
      console.error("Error cargando servicios:", error);
    }
  };

  const confirmDelete = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      if (!serviceToDelete) return;
      await deleteService(serviceToDelete.id);
      toast.success("Servicio deshabilitado correctamente");
      setShowDeleteModal(false);
      setServiceToDelete(null);
      loadServices();
    } catch (err) {
      toast.error("Error al deshabilitar servicio");
      console.error("Error:", err);
    }
  };

  const handleRestore = async (service: Service) => {
    try {
      await restoreService(service.id);
      toast.success("Servicio reactivado correctamente");
      loadServices();
    } catch (err) {
      toast.error("Error al reactivar servicio");
    }
  };

  const handleEdit = (service: Service) => {
    if (!service.activo) {
      toast.info("Rehabilita el servicio antes de editarlo");
      return;
    }
    setSelectedService(service);
    setShowForm(true);
  };

  const handleNew = () => {
    setSelectedService(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <ServicesForm
        service={selectedService}
        onSave={() => { setShowForm(false); loadServices(); }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
  const paginatedServices = services.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading font-bold text-brand-800">Servicios</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInactivos(!showInactivos)}
            className={`clay-btn-secondary px-3 py-2 flex items-center gap-1.5 text-sm transition-all duration-200 ${showInactivos ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter className="h-4 w-4" /> Inactivos
          </button>
          <button onClick={handleNew} className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex items-center gap-2">
            <Plus className="h-5 w-5" /><span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      <div className="clay-card">
        {services.length === 0 ? (
          <EmptyState icon={Plus} title="No hay servicios registrados" description="Crea un nuevo servicio para comenzar" action={
            <button onClick={handleNew} className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white">Nuevo Servicio</button>
          } />
        ) : (
          <>
            <table className="w-full hidden md:table">
              <thead className="bg-brand-50/70">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-brand-600">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-brand-600">Duración</th>
                  <th className="px-6 py-3 text-left text-sm font-heading font-semibold text-brand-600">Precio</th>
                  <th className="px-6 py-3 text-right text-sm font-heading font-semibold text-brand-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {paginatedServices.map((service) => (
                  <tr key={service.id} className={`${!service.activo ? 'opacity-50' : ''} hover:bg-brand-50/30 transition-colors`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-brand-800">{service.nombre}</span>
                      {!service.activo && <span className="ml-2 clay-badge text-xs bg-red-50 text-red-700 border border-red-200">Inactivo</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-500">{service.duracion} min</td>
                    <td className="px-6 py-4 text-sm text-brand-500">${parseFloat(String(service.precio)).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(service)} className="btn-icon p-2 text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-[8px]"><Edit className="h-5 w-5" /></button>
                        {service.activo ? (
                          <button onClick={() => confirmDelete(service)} className="btn-icon p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[8px]"><Ban className="h-5 w-5" /></button>
                        ) : (
                          <button onClick={() => handleRestore(service)} className="btn-icon p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-50 rounded-[8px]"><RotateCcw className="h-5 w-5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="block md:hidden divide-y divide-brand-50">
              {paginatedServices.map((service) => (
                <div key={service.id} className={`p-4 hover:bg-brand-50/30 transition-colors ${!service.activo ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand-800 text-sm">
                        {service.nombre}
                        {!service.activo && <span className="ml-2 clay-badge text-xs bg-red-50 text-red-700 border border-red-200">Inactivo</span>}
                      </p>
                      <p className="text-sm text-brand-500 mt-0.5">{service.duracion} min · ${parseFloat(String(service.precio)).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleEdit(service)} className="btn-icon p-2 text-brand-500 hover:bg-brand-50 rounded-[8px]" title="Editar"><Edit className="h-5 w-5" /></button>
                      {service.activo ? (
                        <button onClick={() => confirmDelete(service)} className="btn-icon p-2 text-red-500 hover:bg-red-50 rounded-[8px]" title="Deshabilitar"><Ban className="h-5 w-5" /></button>
                      ) : (
                        <button onClick={() => handleRestore(service)} className="btn-icon p-2 text-accent-500 hover:bg-accent-50 rounded-[8px]" title="Reactivar"><RotateCcw className="h-5 w-5" /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center modal-overlay-enter">
          <div className="clay-card w-full max-w-md rounded-t-[20px] md:rounded-[16px] p-6 max-h-[90vh] overflow-y-auto modal-enter">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">¿Deshabilitar Servicio?</h3>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro de deshabilitar el servicio <strong>{serviceToDelete?.nombre}</strong>? Podrás reactivarlo después.</p>
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
