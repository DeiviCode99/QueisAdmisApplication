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
        <Loader className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reportes mensuales</h2>
      {months.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay datos para generar reportes.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {months.map((mes) => (
            <div
              key={String(mes.mes)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{mes.label}</p>
                  <p className="text-sm text-gray-500">
                    {mes.total_citas} citas &middot; {formatIngresos(mes.ingresos)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(mes.mes)}
                disabled={downloading === mes.mes}
                className="btn flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-4 py-2 rounded-lg transition-all duration-200"
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
