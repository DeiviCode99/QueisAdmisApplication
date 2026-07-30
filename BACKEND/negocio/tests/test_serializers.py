import pytest
from datetime import date, timedelta
from model_bakery import baker

from negocio.serializers import (
    PacienteSerializer,
    ColaboradorSerializer,
    CitaSerializer,
    HistoriaClinicaSerializer,
    PushSubscriptionSerializer,
)
from negocio.models import (
    Paciente,
    Colaborador,
    Servicio,
    Aperitivo,
    Cita,
    HistoriaClinica,
    PushSubscription,
)


@pytest.mark.django_db
class TestPacienteSerializer:
    def test_paciente_serializer_valid(self):
        data = {
            'nombres': 'Juan Carlos',
            'apellidos': 'Pérez García',
            'tipo_documento': 'CC',
            'numero_documento': '123456789',
            'celular': '3001234567',
            'fecha_nacimiento': date(date.today().year - 20, date.today().month, date.today().day),
            'etiquetas_pac': 'NUV',
        }
        serializer = PacienteSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_paciente_serializer_empty_name(self):
        data = {
            'nombres': 'a',
            'apellidos': 'Pérez García',
            'celular': '3001234567',
        }
        serializer = PacienteSerializer(data=data)
        assert not serializer.is_valid()
        assert 'nombres' in serializer.errors

    def test_paciente_serializer_underage(self):
        data = {
            'nombres': 'Juan',
            'apellidos': 'Pérez',
            'celular': '3001234567',
            'fecha_nacimiento': date(date.today().year - 14, date.today().month, date.today().day),
        }
        serializer = PacienteSerializer(data=data)
        assert not serializer.is_valid()
        assert 'fecha_nacimiento' in serializer.errors

    def test_paciente_serializer_future_dob(self):
        data = {
            'nombres': 'Juan',
            'apellidos': 'Pérez',
            'celular': '3001234567',
            'fecha_nacimiento': date.today() + timedelta(days=365),
        }
        serializer = PacienteSerializer(data=data)
        assert not serializer.is_valid()
        assert 'fecha_nacimiento' in serializer.errors


@pytest.mark.django_db
class TestColaboradorSerializer:
    def test_colaborador_serializer_valid(self):
        data = {
            'nombres': 'María',
            'apellidos': 'López',
            'tipo_documento': 'CC',
            'numero_documento': '987654321',
            'celular': '3109876543',
        }
        serializer = ColaboradorSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_colaborador_serializer_empty_name(self):
        data = {
            'nombres': 'b',
            'apellidos': 'López',
            'numero_documento': '987654321',
            'celular': '3109876543',
        }
        serializer = ColaboradorSerializer(data=data)
        assert not serializer.is_valid()
        assert 'nombres' in serializer.errors


@pytest.mark.django_db
class TestCitaSerializer:
    def test_cita_serializer_valid(self):
        paciente = baker.make(Paciente)
        colaborador = baker.make(Colaborador)
        servicio = baker.make(Servicio)
        aperitivo = baker.make(Aperitivo)
        data = {
            'paciente_id': paciente.pk,
            'colaborador_id': colaborador.pk,
            'servicio_id': servicio.pk,
            'aperitivos': [aperitivo.pk],
            'fecha_hora': date.today() + timedelta(days=1),
            'hora': '10:00:00',
        }
        serializer = CitaSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_cita_serializer_missing_fields(self):
        serializer = CitaSerializer(data={})
        assert not serializer.is_valid()
        for field in ('paciente_id', 'colaborador_id', 'servicio_id', 'fecha_hora', 'hora'):
            assert field in serializer.errors, f'{field} should be in errors'


@pytest.mark.django_db
class TestHistoriaClinicaSerializer:
    def test_historias_serializer(self):
        paciente = baker.make(Paciente)
        data = {
            'paciente': paciente.pk,
            'observaciones': 'Observación de prueba',
            'recomendaciones': 'Recomendación de prueba',
        }
        serializer = HistoriaClinicaSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        instance = serializer.save()
        assert instance.paciente == paciente
        assert instance.observaciones == 'Observación de prueba'
        assert instance.recomendaciones == 'Recomendación de prueba'

        read_serializer = HistoriaClinicaSerializer(instance=instance)
        assert read_serializer.data['observaciones'] == 'Observación de prueba'
        assert read_serializer.data['recomendaciones'] == 'Recomendación de prueba'
        assert read_serializer.data['paciente'] == paciente.pk


@pytest.mark.django_db
class TestPushSubscriptionSerializer:
    def test_push_subscription_serializer_valid(self):
        data = {
            'endpoint': 'https://example.com/push',
            'auth_key': 'auth123',
            'p256dh_key': 'key456',
        }
        serializer = PushSubscriptionSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_push_subscription_serializer_invalid(self):
        serializer = PushSubscriptionSerializer(data={})
        assert not serializer.is_valid()
        assert 'endpoint' in serializer.errors
        assert 'auth_key' in serializer.errors
        assert 'p256dh_key' in serializer.errors
