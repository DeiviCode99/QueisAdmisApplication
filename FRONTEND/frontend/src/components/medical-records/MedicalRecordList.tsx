import { useEffect, useState, useCallback } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Historias Clínicas</h2>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <span className="text-sm text-gray-500">{total} paciente(s)</span>
        </div>

        {selectedPatient && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleDownloadPdf}
                className="btn bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Descargar PDF
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded border mb-6">
              <h3 className="text-lg font-semibold mb-2">Paciente:</h3>
              <p><strong>Nombre:</strong> {selectedPatient.paciente_nombre}</p>
              <p><strong>Documento:</strong> {selectedPatient.paciente_documento || '—'}</p>
              <p><strong>Email:</strong> {selectedPatient.paciente_email || '—'}</p>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {appointments.map((appt) => (
                  <div key={appt.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p><strong>Fecha:</strong> {appt.fecha_hora}</p>
                    <p><strong>Hora:</strong> {appt.hora}</p>
                    <p><strong>Servicio:</strong> {appt.servicio?.nombre || 'N/A'}</p>
                    <p><strong>Colaborador:</strong> {appt.colaborador?.nombres || 'N/A'} {appt.colaborador?.apellidos || ''}</p>
                    <p><strong>Notas:</strong> {appt.notas || 'N/A'}</p>
                    <p><strong>Saldo Pendiente:</strong> ${appt.saldo_pend}</p>
                    <p><strong>Estado:</strong> {estadoLabel(appt.estado)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-6">Este paciente aún no tiene citas registradas.</p>
            )}
          </>
        )}

        <div className="overflow-y-auto max-h-[500px] grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {loading ? (
            <p className="text-gray-500 col-span-full text-center py-8">Cargando...</p>
          ) : patients.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-8">No se encontraron pacientes con historias clínicas.</p>
          ) : (
            patients.map((p) => (
              <div
                key={p.paciente_id}
                className={`cursor-pointer p-4 border rounded hover:border-emerald-500 ${selectedPatient?.paciente_id === p.paciente_id ? 'border-emerald-500 bg-emerald-50' : ''}`}
                onClick={() => handleSelectPatient(p)}
              >
                <p className="font-semibold text-gray-800">{p.paciente_nombre}</p>
                <p className="text-sm text-gray-500">{p.paciente_documento}</p>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
