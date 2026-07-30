from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from .views_reportes import report_months, report_month_detail, report_pdf, report_list

router = DefaultRouter()
router.register('pacientes', PacienteViewSet)
router.register('trabajadores', ColaboradorViewSet)
router.register('tratamientos', TratamientoViewSet)
router.register('aperitivos', AperitivoViewSet)
router.register('servicios', ServicioViewSet)
router.register('citas', CitaViewSet)
router.register('historias', HistoriaClinicaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('tipos-documento/', TipoDocumentoChoices.as_view(), name='tipos-documento'),
    path('tipos-documento2/', TipoDocumentoChoices2.as_view(), name='tipos-documento'),
    path('estados-cita/', appointment_statuses, name='estados-cita'),
    path('etiquetas-pac/', LabelPatient.as_view(), name='etiquetas-pac'),
    path('historias-clinicas/', HistoriasPorPaciente.as_view(), name='historias-clinicas'),
    path('historias/paciente/<int:paciente_id>/pdf/', historia_clinica_pdf, name='historia-clinica-pdf'),
    path('reportes/', report_list, name='report-list'),
    path('reportes/meses/', report_months, name='report-months'),
    path('reportes/meses/<str:mes>/', report_month_detail, name='report-month-detail'),
    path('reportes/meses/<str:mes>/pdf/', report_pdf, name='report-pdf'),
    path('push/subscribe/', push_subscribe, name='push-subscribe'),
    path('push/unsubscribe/', push_unsubscribe, name='push-unsubscribe'),
    path('push/public-key/', push_public_key, name='push-public-key'),
]
