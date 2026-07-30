import api from './axiosClient'
import { AxiosResponse } from 'axios'

export const getPatients = (showInactivos?: boolean): Promise<Record<string, unknown>> =>
  api.get(`pacientes/${showInactivos ? '?inactivos=true' : ''}`).then(res => res.data);
export const getPatient = (id: number | string): Promise<Record<string, unknown>> =>
  api.get(`pacientes/${id}/`).then(res => res.data);
export const createPatient = (data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.post('pacientes/', data);
export const updatePatient = (id: number | string, data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.put(`pacientes/${id}/`, data);
export const deletePatient = (id: number | string): Promise<AxiosResponse> =>
  api.delete(`pacientes/${id}/`);
export const restorePatient = (id: number | string): Promise<AxiosResponse> =>
  api.patch(`pacientes/${id}/?inactivos=true`, { activo: true });

// ---------------------- CITAS ----------------------
export const getAppointments = (): Promise<Record<string, unknown>> =>
  api.get('citas/').then(res => res.data);
export const getAppointment = (id: number | string): Promise<Record<string, unknown>> =>
  api.get(`citas/${id}/`).then(res => res.data);
export const createAppointment = (data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.post('citas/', data);
export const updateAppointment = (id: number | string, data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.put(`citas/${id}/`, data);

// ---------------------- HISTORIAS CLÍNICAS ----------------------
export const getMedicalRecords = (page = 1, search = ''): Promise<Record<string, unknown>> =>
  api.get('historias-clinicas/', { params: { page, search, page_size: 20 } }).then(res => res.data);
export const updateMedicalRecord = (id: number | string, data: Record<string, unknown>): Promise<Record<string, unknown>> =>
  api.put(`historias/${id}/`, data).then(res => res.data);
export const downloadHistoriaClinicaPdf = (pacienteId: number | string): Promise<Blob> =>
  api.get(`historias/paciente/${pacienteId}/pdf/`, { responseType: 'blob' }).then(res => res.data);

// ---------------------- TRATAMIENTOS ----------------------
export const getTreatments = (showInactivos?: boolean): Promise<Record<string, unknown>> =>
  api.get(`tratamientos/${showInactivos ? '?inactivos=true' : ''}`).then(res => res.data);
export const getTreatment = (id: number | string): Promise<Record<string, unknown>> =>
  api.get(`tratamientos/${id}/`).then(res => res.data);
export const createTreatment = (data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.post('tratamientos/', data);
export const updateTreatment = (id: number | string, data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.put(`tratamientos/${id}/`, data);
export const deleteTreatment = (id: number | string): Promise<AxiosResponse> =>
  api.delete(`tratamientos/${id}/`);
export const restoreTreatment = (id: number | string): Promise<AxiosResponse> =>
  api.patch(`tratamientos/${id}/?inactivos=true`, { activo: true });

// ---------------------- APERITIVOS ----------------------
export const getSnacks = (showInactivos?: boolean): Promise<Record<string, unknown>> =>
  api.get(`aperitivos/${showInactivos ? '?inactivos=true' : ''}`).then(res => res.data);
export const getSnack = (id: number | string): Promise<Record<string, unknown>> =>
  api.get(`aperitivos/${id}/`).then(res => res.data);
export const createSnack = (data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.post('aperitivos/', data);
export const updateSnack = (id: number | string, data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.put(`aperitivos/${id}/`, data);
export const deleteSnack = (id: number | string): Promise<AxiosResponse> =>
  api.delete(`aperitivos/${id}/`);
export const restoreSnack = (id: number | string): Promise<AxiosResponse> =>
  api.patch(`aperitivos/${id}/?inactivos=true`, { activo: true });

// ---------------------- SERVICIOS ----------------------
export const getServices = (showInactivos?: boolean): Promise<Record<string, unknown>> =>
  api.get(`servicios/${showInactivos ? '?inactivos=true' : ''}`).then(res => res.data);
export const getService = (id: number | string): Promise<Record<string, unknown>> =>
  api.get(`servicios/${id}/`).then(res => res.data);
export const createService = (data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.post('servicios/', data);
export const updateService = (id: number | string, data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.put(`servicios/${id}/`, data);
export const deleteService = (id: number | string): Promise<AxiosResponse> =>
  api.delete(`servicios/${id}/`);
export const restoreService = (id: number | string): Promise<AxiosResponse> =>
  api.patch(`servicios/${id}/?inactivos=true`, { activo: true });

// ---------------------- TRABAJADORES ----------------------
export const getWorkers = (showInactivos?: boolean): Promise<Record<string, unknown>> =>
  api.get(`trabajadores/${showInactivos ? '?inactivos=true' : ''}`).then(res => res.data);
export const getWorker = (id: number | string): Promise<Record<string, unknown>> =>
  api.get(`trabajadores/${id}/`).then(res => res.data);
export const createWorker = (data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.post('trabajadores/', data);
export const updateWorker = (id: number | string, data: Record<string, unknown>): Promise<AxiosResponse> =>
  api.put(`trabajadores/${id}/`, data);
export const deleteWorker = (id: number | string): Promise<AxiosResponse> =>
  api.delete(`trabajadores/${id}/`);
export const restoreWorker = (id: number | string): Promise<AxiosResponse> =>
  api.patch(`trabajadores/${id}/?inactivos=true`, { activo: true });

//------------------------TIPO DE DOCUMENTOS(PACIENTE)------------------
export const getDocumentTypes = (): Promise<Record<string, unknown>> =>
  api.get('tipos-documento/').then(res => res.data);

//------------------------ESTADOS DE LAS CITAS------------------
export const getAppointmentStatuses = (): Promise<Record<string, unknown>> =>
  api.get('estados-cita/').then(res => res.data);

//------------------------TIPO DE DOCUMENTOS(COLABORADOR)------------------
export const getDocumentTypes2 = (): Promise<Record<string, unknown>> =>
  api.get('tipos-documento2/').then(res => res.data);

//------------------------ETIQUETAS PACIENTE------------------
export const getLabelPat = (): Promise<Record<string, unknown>> =>
  api.get('etiquetas-pac/').then(res => res.data);

// ---------------------- REPORTES ----------------------
export const getReportMonths = (): Promise<Record<string, unknown>> =>
  api.get('reportes/meses/').then(res => res.data);
export const getMonthReport = (mes: number | string): Promise<Record<string, unknown>> =>
  api.get(`reportes/meses/${mes}/`).then(res => res.data);
export const getReportsList = (): Promise<Record<string, unknown>> =>
  api.get('reportes/').then(res => res.data);
export const downloadMonthPdf = (mes: number | string): Promise<Blob> =>
  api.get(`reportes/meses/${mes}/pdf/`, { responseType: 'blob' }).then(res => res.data);
