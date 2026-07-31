import { useEffect, useState, useCallback } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { getMedicalRecords, getAppointments, downloadHistoriaClinicaPdf } from '../../lib/api';
import { toast } from 'react-toastify';

interface PatientRecord {
  paciente_id: number | string;
  paciente_nombre: string;
  paciente_documento?: string;
  paciente_email?: string;
}

interface Appointment {
  id: number | string;
  paciente?: { id: number | string };
  paciente_id?: number | string;
  fecha_hora: string;
  hora: string;
  servicio?: { nombre: string };
  colaborador?: { nombres: string; apellidos: string };
  notas?: string;
  saldo_pend: number;
  estado: string;
}

interface MedicalRecordsResponse {
  results: PatientRecord[];
  total_pages: number;
  count: number;
}

export default function MedicalRecordList() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPatients = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getMedicalRecords(page, searchTerm);
      const resp = data as unknown as MedicalRecordsResponse;
      setPatients(resp.results || []);
      setTotalPages(resp.total_pages || 1);
      setTotal(resp.count || 0);
    } catch (err) {
      console.error('Error cargando pacientes:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSelectPatient = async (patient: PatientRecord): Promise<void> => {
    setSelectedPatient(patient);
    try {
      const allAppointments = await getAppointments();
      const patientAppointments = (allAppointments as unknown as Appointment[]).filter(
        (cita) => cita.paciente?.id === patient.paciente_id
      );
      setAppointments(patientAppointments);
    } catch (err) {
      console.error('Error cargando citas:', err);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    if (!selectedPatient) return;
    try {
      const blob = await downloadHistoriaClinicaPdf(selectedPatient.paciente_id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HistoriaClinica_${selectedPatient.paciente_nombre}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado correctamente');
    } catch (err) {
      toast.error('Error al descargar PDF');
      console.error('Error descargando PDF:', err);
    }
  };

  const estadoLabel = (estado: string): string => {
    const map: Record<string, string> = { PEND: 'Pendiente', REAL: 'Realizada', CANC: 'Cancelada', RETR: 'Atrasada' };
    return map[estado] || estado;
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6">
        <h2 className="text-2xl font-heading font-bold text-brand-800 mb-4">Historias Clínicas</h2>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-300 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={handleSearch}
              className="clay-input pl-9 pr-3 py-2"
            />
          </div>
          <span className="text-sm text-brand-500">{total} paciente(s)</span>
        </div>

        {selectedPatient && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleDownloadPdf}
                className="clay-btn px-4 py-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Descargar PDF
              </button>
            </div>

            <div className="bg-brand-50/50 p-4 rounded-[12px] border border-brand-100/50 mb-6">
              <h3 className="text-lg font-heading font-semibold text-brand-800 mb-2">Paciente:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-brand-500">Nombre:</span> <span className="text-brand-800 font-medium">{selectedPatient.paciente_nombre}</span></p>
                <p><span className="text-brand-500">Documento:</span> <span className="text-brand-800">{selectedPatient.paciente_documento || '—'}</span></p>
                <p><span className="text-brand-500">Email:</span> <span className="text-brand-800">{selectedPatient.paciente_email || '—'}</span></p>
              </div>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {appointments.map((appt) => (
                  <div key={appt.id} className="clay-card p-4 !rounded-[12px]">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-brand-500">Fecha:</span> <span className="text-brand-800">{appt.fecha_hora}</span></div>
                      <div><span className="text-brand-500">Hora:</span> <span className="text-brand-800">{appt.hora}</span></div>
                      <div><span className="text-brand-500">Servicio:</span> <span className="text-brand-800">{appt.servicio?.nombre || 'N/A'}</span></div>
                      <div><span className="text-brand-500">Colaborador:</span> <span className="text-brand-800">{appt.colaborador?.nombres || 'N/A'} {appt.colaborador?.apellidos || ''}</span></div>
                      <div><span className="text-brand-500">Saldo:</span> <span className="text-brand-800">${appt.saldo_pend}</span></div>
                      <div><span className="text-brand-500">Estado:</span> <span className="text-brand-800">{estadoLabel(appt.estado)}</span></div>
                    </div>
                    {appt.notas && <p className="text-sm text-brand-500 mt-2"><span className="text-brand-500">Notas:</span> {appt.notas}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-500 mb-6 text-sm">Este paciente aún no tiene citas registradas.</p>
            )}
          </>
        )}

        <div className="overflow-y-auto max-h-[500px] grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {loading ? (
            <p className="text-brand-500 col-span-full text-center py-8">Cargando...</p>
          ) : patients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-brand-50 p-3 rounded-[12px] inline-flex mb-3">
                <FileText className="h-6 w-6 text-brand-400" />
              </div>
              <p className="text-brand-500">No se encontraron pacientes con historias clínicas.</p>
            </div>
          ) : (
            patients.map((p) => (
              <div
                key={p.paciente_id}
                className={`cursor-pointer p-4 rounded-[12px] transition-all duration-200 border ${
                  selectedPatient?.paciente_id === p.paciente_id
                    ? 'border-brand-400 bg-brand-50 shadow-[0_4px_12px_rgba(14,165,233,0.1)]'
                    : 'border-brand-100/50 bg-white hover:border-brand-300 hover:shadow-[0_4px_12px_rgba(14,165,233,0.06)]'
                }`}
                onClick={() => handleSelectPatient(p)}
              >
                <p className="font-heading font-semibold text-brand-800">{p.paciente_nombre}</p>
                <p className="text-sm text-brand-500">{p.paciente_documento}</p>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="clay-btn-secondary px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <span className="text-sm text-brand-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="clay-btn-secondary px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
