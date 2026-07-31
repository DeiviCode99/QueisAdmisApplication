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
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="btn-icon p-2 text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-[10px] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-heading font-bold text-brand-800">{patient.nombres} {patient.apellidos}</h2>
            <p className="text-brand-500 text-sm">Perfil del Paciente</p>
          </div>
        </div>
        <button onClick={onEdit} className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex items-center gap-2">
          <Edit className="h-4 w-4" /><span>Editar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="clay-card p-6">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <Phone className="h-5 w-5 text-brand-400" />
                <div>
                  <p className="text-xs text-brand-500">Celular</p>
                  <p className="font-medium text-brand-800 text-sm">{patient.celular}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-50/50 rounded-[10px]">
                <Calendar className="h-5 w-5 text-brand-400" />
                <div>
                  <p className="text-xs text-brand-500">Fecha de Nacimiento</p>
                  <p className="font-medium text-brand-800 text-sm">
                    {patient.fecha_nacimiento ? `${patient.fecha_nacimiento.split('-').reverse().join('/')} (${calculateAge(patient.fecha_nacimiento)})` : '—'}
                  </p>
                </div>
              </div>
              {patient.direccion && (
                <div className="md:col-span-2 p-3 bg-brand-50/50 rounded-[10px]">
                  <p className="text-xs text-brand-500">Dirección</p>
                  <p className="font-medium text-brand-800 text-sm">{patient.direccion}</p>
                </div>
              )}
            </div>
          </div>

          {(patient.emergencia_nombre || patient.emergencia_number) && (
            <div className="clay-card p-6">
              <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.emergencia_nombre && (
                  <div className="p-3 bg-brand-50/50 rounded-[10px]">
                    <p className="text-xs text-brand-500">Nombre</p>
                    <p className="font-medium text-brand-800 text-sm">{patient.emergencia_nombre}</p>
                  </div>
                )}
                {patient.emergencia_number && (
                  <div className="p-3 bg-brand-50/50 rounded-[10px]">
                    <p className="text-xs text-brand-500">Celular</p>
                    <p className="font-medium text-brand-800 text-sm">{patient.emergencia_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(patient.condiciones_medicas || patient.alergias || patient.extras) && (
            <div className="clay-card p-6">
              <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Información Médica</span>
              </h3>
              <div className="space-y-4">
                {patient.condiciones_medicas && (
                  <div>
                    <p className="text-sm font-medium text-brand-700 mb-1">Condiciones Médicas</p>
                    <p className="text-brand-800 bg-brand-50/50 p-3 rounded-[10px] text-sm">{patient.condiciones_medicas}</p>
                  </div>
                )}
                {patient.alergias && (
                  <div>
                    <p className="text-sm font-medium text-brand-700 mb-1">Alergias</p>
                    <p className="text-brand-800 bg-red-50/50 p-3 rounded-[10px] border border-red-200 text-sm">{patient.alergias}</p>
                  </div>
                )}
                {patient.extras && (
                  <div>
                    <p className="text-sm font-medium text-brand-700 mb-1">Extras</p>
                    <p className="text-brand-800 bg-blue-50/50 p-3 rounded-[10px] border border-blue-200 text-sm">{displayExtras(patient.extras)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="clay-card p-6">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm text-brand-500">Registrado desde</span>
                <span className="text-sm font-medium text-brand-800">{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-brand-50/50 rounded-[10px]">
                <span className="text-sm text-brand-500">Historias clínicas</span>
                <span className="text-sm font-medium text-brand-800">{medicalRecords.length}</span>
              </div>
            </div>
          </div>

          <div className="clay-card p-6">
            <h3 className="text-lg font-heading font-semibold text-brand-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" /><span>Historias Recientes</span>
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500"></div>
              </div>
            ) : medicalRecords.length === 0 ? (
              <p className="text-brand-500 text-center py-4 text-sm">No hay historias clínicas</p>
            ) : (
              <div className="space-y-3">
                {(showAllRecords ? medicalRecords : medicalRecords.slice(0, 3)).map((record) => (
                  <div key={record.id} className="p-3 bg-brand-50/50 rounded-[10px]">
                    <p className="font-medium text-brand-800 text-sm">{record.observaciones || 'Sin observaciones'}</p>
                    <p className="text-xs text-brand-500 mt-1">{record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}</p>
                  </div>
                ))}
                {medicalRecords.length > 3 && (
                  <button onClick={() => setShowAllRecords(!showAllRecords)}
                    className="text-sm text-brand-600 font-medium w-full text-center hover:text-brand-700 transition-colors">
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
