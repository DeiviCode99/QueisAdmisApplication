import { useState, type ReactNode } from 'react';
import { UserCog, Stethoscope, ClipboardList, Salad } from 'lucide-react';
import WorkerList from '../workers/WorkersList';
import TreatmentsList from '../treatments/TreatmentsList';
import ServicesList from '../services/ServicesList';
import SnacksList from '../snacks/SnacksList';

interface Module {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export default function Settings() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const modules: Module[] = [
    {
      key: 'workers',
      title: 'Trabajadores',
      description: 'Administra el personal del spa',
      icon: <UserCog className="h-6 w-6 text-brand-500" />,
    },
    {
      key: 'treatments',
      title: 'Tratamientos',
      description: 'Edita y agrega tratamientos ofrecidos',
      icon: <Stethoscope className="h-6 w-6 text-brand-500" />,
    },
    {
      key: 'services',
      title: 'Servicios',
      description: 'Configura los servicios disponibles',
      icon: <ClipboardList className="h-6 w-6 text-brand-500" />,
    },
    {
      key: 'snacks',
      title: 'Snacks',
      description: 'Configura los aperitivos y snacks',
      icon: <Salad className="h-6 w-6 text-brand-500" />,
    },
  ];

  const renderModule = (): ReactNode => {
    switch (activeModule) {
      case 'workers':
        return <WorkerList />;
      case 'treatments':
        return <TreatmentsList />;
      case 'services':
        return <ServicesList />;
      case 'snacks':
        return <SnacksList />;
      default:
        return (
          <div className="text-center text-brand-500 py-12">
            Selecciona una opción de configuración para comenzar.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-8">
        <h3 className="text-2xl font-heading font-bold text-brand-800 mb-6 text-center">Configuración</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.key}
              onClick={() => setActiveModule(mod.key)}
              className="cursor-pointer p-6 rounded-[14px] border border-brand-100/50 bg-white transition-all duration-200 hover:shadow-[0_8px_24px_rgba(14,165,233,0.08),-4px_-4px_12px_rgba(255,255,255,0.7)] hover:border-brand-300/50"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-brand-50 p-3 rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  {mod.icon}
                </div>
                <h4 className="text-lg font-heading font-semibold text-brand-800">{mod.title}</h4>
              </div>
              <p className="text-sm text-brand-500">{mod.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="clay-card p-6">
        {renderModule()}
      </div>
    </div>
  );
}
