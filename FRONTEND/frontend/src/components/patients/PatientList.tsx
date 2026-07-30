import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Ban, Eye, Users, RotateCcw, Filter } from 'lucide-react';
import { getPatients, deletePatient, restorePatient } from '../../lib/api';
import PatientForm from './PatientForm';
import PatientView from './PatientView';
import Skeleton from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';

interface Patient {
  id: number | string;
  nombres: string;
  apellidos: string;
  celular?: string;
  fecha_nacimiento?: string;
  created_at?: string;
  activo: boolean;
  etiquetas_pac?: string;
  condiciones_medicas?: string;
}

const ITEMS_PER_PAGE = 10;

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivos, setShowInactivos] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadPatients();
  }, [showInactivos]);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      `${patient.nombres} ${patient.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.celular && patient.celular.includes(searchTerm))
    );
    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [patients, searchTerm]);

  const loadPatients = async (): Promise<void> => {
    try {
      const data = await getPatients(showInactivos);
      setPatients(data as unknown as Patient[]);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePatient = async (): Promise<void> => {
    await loadPatients();
    setShowForm(false);
    setSelectedPatient(null);
  };

  const confirmDeletePatient = (patient: Patient): void => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async (): Promise<void> => {
    try {
      await deletePatient(patientToDelete!.id);
      toast.success('Paciente deshabilitado correctamente');
      setShowDeleteModal(false);
      setPatientToDelete(null);
      await loadPatients();
    } catch (error) {
      toast.error('Error al deshabilitar paciente');
      console.error('Error:', error);
    }
  };

  const handleRestorePatient = async (patient: Patient): Promise<void> => {
    try {
      await restorePatient(patient.id);
      toast.success('Paciente reactivado correctamente');
      await loadPatients();
    } catch (error) {
      toast.error('Error al reactivar paciente');
      console.error('Error:', error);
    }
  };

  const handleEditPatient = (patient: Patient): void => {
    if (!patient.activo) {
      toast.info('Rehabilita el paciente antes de editarlo');
      return;
    }
    setSelectedPatient(patient);
    setShowForm(true);
  };

  const handleViewPatient = (patient: Patient): void => {
    setSelectedPatient(patient);
    setShowView(true);
  };

  const handleNewPatient = (): void => {
    setSelectedPatient(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <PatientForm
        patient={selectedPatient}
        onSave={handleSavePatient}
        onCancel={() => { setShowForm(false); setSelectedPatient(null); }}
      />
    );
  }

  if (showView && selectedPatient) {
    return (
      <PatientView
        patient={selectedPatient}
        onClose={() => { setShowView(false); setSelectedPatient(null); }}
        onEdit={() => { setShowView(false); handleEditPatient(selectedPatient); }}
      />
    );
  }

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text" placeholder="Buscar pacientes..." value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 md:py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactivos(!showInactivos)}
            className={`btn px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm transition-colors ${showInactivos ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter className="h-4 w-4" />
            Inactivos
          </button>
          <button onClick={handleNewPatient} className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-16 w-full" count={5} />
        </div>
      ) : filteredPatients.length === 0 ? (
        <EmptyState icon={Users} title={searchTerm ? "No se encontraron pacientes" : "No hay pacientes registrados"}
          description={searchTerm ? "Intenta con otro término de búsqueda" : "Registra tu primer paciente para comenzar"}
          action={!searchTerm ? <button onClick={handleNewPatient} className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">Nuevo Paciente</button> : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="overflow-y-auto max-h-[500px] hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nacimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id} className={`hover:bg-brand-50 transition-colors ${!patient.activo ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{patient.nombres} {patient.apellidos}</span>
                        {!patient.activo && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Inactivo</span>}
                        {patient.etiquetas_pac && (
                          <span className={`w-3 h-3 rounded-full ${
                            patient.etiquetas_pac === 'NUV' ? 'bg-yellow-400' :
                            patient.etiquetas_pac === 'ANT' ? 'bg-purple-600' :
                            patient.etiquetas_pac === 'PPN' ? 'bg-red-600' :
                            patient.etiquetas_pac === 'JOD' ? 'bg-sky-400' : 'bg-gray-300'
                          }`} title={patient.etiquetas_pac}></span>
                        )}
                      </div>
                      {patient.condiciones_medicas && <div className="text-sm text-gray-500">Condiciones médicas</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{patient.celular}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.fecha_nacimiento ? patient.fecha_nacimiento.split('-').reverse().join('/') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleViewPatient(patient)} className="btn-icon text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50" title="Ver detalles"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handleEditPatient(patient)} className="btn-icon text-emerald-600 hover:text-emerald-900 p-2 rounded hover:bg-emerald-50" title="Editar"><Edit className="h-4 w-4" /></button>
                        {patient.activo ? (
                          <button onClick={() => confirmDeletePatient(patient)} className="btn-icon text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50" title="Deshabilitar"><Ban className="h-4 w-4" /></button>
                        ) : (
                          <button onClick={() => handleRestorePatient(patient)} className="btn-icon text-emerald-600 hover:text-emerald-900 p-2 rounded hover:bg-emerald-50" title="Reactivar"><RotateCcw className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="block md:hidden divide-y divide-gray-200">
            {paginatedPatients.map((patient) => (
              <div key={patient.id} className={`p-4 hover:bg-brand-50 transition-colors ${!patient.activo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{patient.nombres} {patient.apellidos}</p>
                      {!patient.activo && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium shrink-0">Inactivo</span>}
                      {patient.etiquetas_pac && (
                        <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                          patient.etiquetas_pac === 'NUV' ? 'bg-yellow-400' :
                          patient.etiquetas_pac === 'ANT' ? 'bg-purple-600' :
                          patient.etiquetas_pac === 'PPN' ? 'bg-red-600' :
                          patient.etiquetas_pac === 'JOD' ? 'bg-sky-400' : 'bg-gray-300'
                        }`} title={patient.etiquetas_pac} />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{patient.celular || '—'}</p>
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                      <span>Nac: {patient.fecha_nacimiento ? patient.fecha_nacimiento.split('-').reverse().join('/') : '—'}</span>
                      <span>Reg: {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                    {patient.condiciones_medicas && <p className="text-xs text-amber-600 mt-1">⚠ Condiciones médicas</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleViewPatient(patient)} className="btn-icon p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => handleEditPatient(patient)} className="btn-icon p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Editar"><Edit className="h-4 w-4" /></button>
                    {patient.activo ? (
                      <button onClick={() => confirmDeletePatient(patient)} className="btn-icon p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Deshabilitar"><Ban className="h-4 w-4" /></button>
                    ) : (
                      <button onClick={() => handleRestorePatient(patient)} className="btn-icon p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Reactivar"><RotateCcw className="h-4 w-4" /></button>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Deshabilitar Paciente?</h3>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro de deshabilitar al paciente <strong>{patientToDelete?.nombres} {patientToDelete?.apellidos}</strong>? Podrás reactivarlo después.</p>
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
