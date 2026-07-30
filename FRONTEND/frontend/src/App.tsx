import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/dashboard/Dashboard';
import PatientList from './components/patients/PatientList';
import AppointmentList from './components/appointments/AppointmentList';
import Settings from './components/settings/SettingsPanel';
import MedicalRecordList from './components/medical-records/MedicalRecordList';
import ReportsList from './components/reports/ReportsList';
import ErrorBoundary from './components/ui/ErrorBoundary';
import 'react-toastify/ReactToastify.css';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/citas" element={<AppointmentList />} />
            <Route path="/pacientes" element={<PatientList />} />
            <Route path="/historias-clinicas" element={<MedicalRecordList />} />
            <Route path="/configuracion" element={<Settings />} />
            <Route path="/reportes" element={<ReportsList />} />
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
