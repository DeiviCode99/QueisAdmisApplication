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
      icon: <UserCog className="h-6 w-6 text-emerald-500" />,
    },
    {
      key: 'treatments',
      title: 'Tratamientos',
      description: 'Edita y agrega tratamientos ofrecidos',
      icon: <Stethoscope className="h-6 w-6 text-emerald-500" />,
    },
    {
      key: 'services',
      title: 'Services',
      description: 'Configura los servicios disponibles',
      icon: <ClipboardList className="h-6 w-6 text-emerald-500" />,
    },
    {
      key: 'snacks',
      title: 'Snacks',
      description: 'Configura los Snacks',
      icon: <Salad className="h-6 w-6 text-emerald-500" />,
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
          <div className="text-center text-gray-500 py-12">
            Selecciona una opción de configuración para comenzar.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Configuración</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.key}
              onClick={() => setActiveModule(mod.key)}
              className="cursor-pointer p-6 border border-gray-200 rounded-lg shadow hover:shadow-md hover:border-emerald-500 transition-all duration-200"
            >
              <div className="flex items-center space-x-4 mb-4">
                {mod.icon}
                <h4 className="text-lg font-semibold text-gray-800">{mod.title}</h4>
              </div>
              <p className="text-sm text-gray-600">{mod.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {renderModule()}
      </div>
    </div>
  );
}
