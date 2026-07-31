import { useEffect, useState } from 'react';
import { FileText, Download, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { getReportMonths, downloadMonthPdf } from '../../lib/api';

interface MonthData {
  mes: number | string;
  label: string;
  total_citas: number;
  ingresos: number | string;
}

export default function ReportsList() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | string | null>(null);

  useEffect(() => {
    getReportMonths()
      .then((data) => setMonths(data as unknown as MonthData[]))
      .catch((err) => {
        console.error('Error cargando reportes:', err);
        toast.error('Error al cargar los datos');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (mes: number | string) => {
    setDownloading(mes);
    try {
      const blob = await downloadMonthPdf(mes);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte-${mes}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    } finally {
      setDownloading(null);
    }
  };

  const formatIngresos = (val: number | string) =>
    Number(val).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-brand-800">Reportes mensuales</h2>
      {months.length === 0 ? (
        <div className="clay-card p-8 text-center">
          <div className="bg-brand-50 p-4 rounded-[14px] inline-flex mb-3">
            <FileText className="h-10 w-10 text-brand-400" />
          </div>
          <p className="text-brand-500">No hay datos para generar reportes.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {months.map((mes) => (
            <div
              key={String(mes.mes)}
              className="clay-card p-5 flex items-center justify-between clay-card-hover"
            >
              <div className="flex items-center gap-4">
                <div className="bg-brand-50 p-3 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <FileText className="h-6 w-6 text-brand-500" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-brand-800">{mes.label}</p>
                  <p className="text-sm text-brand-500">
                    {mes.total_citas} citas &middot; {formatIngresos(mes.ingresos)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(mes.mes)}
                disabled={downloading === mes.mes}
                className="clay-btn flex items-center gap-2 bg-gradient-to-b from-brand-400 to-brand-500 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading === mes.mes ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">PDF</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
