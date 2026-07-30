import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Phone, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { getMedicalRecords } from '../../lib/api';

interface Patient {
  id: number | string;
  nombres: string;
  apellidos: string;
  celular?: string;
  fecha_nacimiento?: string;
  created_at?: string;
  direccion?: string;
  emergencia_nombre?: string;
  emergencia_number?: string;
  condiciones_medicas?: string;
  alergias?: string;
  extras?: string[] | string;
}

interface MedicalRecord {
  id: number | string;
  patient_id: number | string;
  observaciones?: string;
  created_at?: string;
}

interface PatientViewProps {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
}

export default function PatientView({ patient, onClose, onEdit }: PatientViewProps) {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllRecords, setShowAllRecords] = useState(false);

  useEffect(() => {
    loadMedicalRecords();
  }, [patient.id]);

  const loadMedicalRecords = async (): Promise<void> => {
    try {
      const records = await getMedicalRecords();
      const filtered = (records as unknown as MedicalRecord[]).filter(r => r.patient_id === patient.id);
      setMedicalRecords(filtered);
    } catch (error) {
      console.error('Error loading medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '—';
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime()) || birth > today) return '—';
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  const displayExtras = (extras: string[] | string | undefined): string | null => {
    if (!extras) return null;
    if (Array.isArray(extras)) return extras.join(', ');
    return String(extras);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="btn-icon p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{patient.nombres} {patient.apellidos}</h2>
            <p className="text-gray-600">Perfil del Paciente</p>
          </div>
        </div>
        <button onClick={onEdit} className="btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2">
          <Edit className="h-4 w-4" /><span>Editar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Celular</p>
                  <p className="font-medium text-gray-800">{patient.celular}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                  <p className="font-medium text-gray-800">
                    {patient.fecha_nacimiento ? `${patient.fecha_nacimiento.split('-').reverse().join('/')} (${calculateAge(patient.fecha_nacimiento)})` : '—'}
                  </p>
                </div>
              </div>
              {patient.direccion && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium text-gray-800">{patient.direccion}</p>
                </div>
              )}
            </div>
          </div>

          {(patient.emergencia_nombre || patient.emergencia_number) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.emergencia_nombre && (
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-800">{patient.emergencia_nombre}</p>
                  </div>
                )}
                {patient.emergencia_number && (
                  <div>
                    <p className="text-sm text-gray-600">Celular</p>
                    <p className="font-medium text-gray-800">{patient.emergencia_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(patient.condiciones_medicas || patient.alergias || patient.extras) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Información Médica</span>
              </h3>
              <div className="space-y-4">
                {patient.condiciones_medicas && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Condiciones Médicas</p>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{patient.condiciones_medicas}</p>
                  </div>
                )}
                {patient.alergias && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Alergias</p>
                    <p className="text-gray-800 bg-red-50 p-3 rounded-lg border border-red-200">{patient.alergias}</p>
                  </div>
                )}
                {patient.extras && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Extras</p>
                    <p className="text-gray-800 bg-blue-50 p-3 rounded-lg border border-blue-200">{displayExtras(patient.extras)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registrado desde</span>
                <span className="font-medium">{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Historias clínicas</span>
                <span className="font-medium">{medicalRecords.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5" /><span>Historias Recientes</span>
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
            ) : medicalRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay historias clínicas</p>
            ) : (
              <div className="space-y-3">
                {(showAllRecords ? medicalRecords : medicalRecords.slice(0, 3)).map((record) => (
                  <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800 text-sm">{record.observaciones || 'Sin observaciones'}</p>
                    <p className="text-xs text-gray-600">{record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}</p>
                  </div>
                ))}
                {medicalRecords.length > 3 && (
                  <button onClick={() => setShowAllRecords(!showAllRecords)}
                    className="text-sm text-emerald-600 font-medium w-full text-center hover:underline">
                    {showAllRecords ? 'Ver menos' : `Ver todas (${medicalRecords.length})`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
