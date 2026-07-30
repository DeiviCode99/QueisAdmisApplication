import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from model_bakery import baker
from negocio.models import (
    Paciente,
    Tratamiento,
    Aperitivo,
    Servicio,
    Colaborador,
    Cita,
    HistoriaClinica,
)

pytestmark = pytest.mark.django_db


class TestPacientes:
    def test_list_pacientes_unauthenticated(self):
        client = APIClient()
        response = client.get("/api/pacientes/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_paciente_authenticated(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        data = {
            "nombres": "Juan Carlos",
            "apellidos": "Pérez López",
            "celular": "1234567890",
            "numero_documento": "1234567890",
        }
        response = client.post("/api/pacientes/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Paciente.objects.count() == 1
        assert response.data["nombres"] == "Juan Carlos"

    def test_create_paciente_invalid_data(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        data = {
            "nombres": "A",
            "apellidos": "B",
            "celular": "not-a-number",
        }
        response = client.post("/api/pacientes/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_soft_delete_paciente(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        paciente = baker.make(Paciente, activo=True)
        response = client.delete(f"/api/pacientes/{paciente.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        paciente.refresh_from_db()
        assert paciente.activo is False


class TestPublicReadOnly:
    def test_list_tratamientos_public(self):
        baker.make(Tratamiento, _quantity=3)
        client = APIClient()
        response = client.get("/api/tratamientos/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_list_aperitivos_public(self):
        baker.make(Aperitivo, _quantity=2)
        client = APIClient()
        response = client.get("/api/aperitivos/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_list_servicios_public(self):
        baker.make(Servicio, _quantity=3)
        client = APIClient()
        response = client.get("/api/servicios/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3


class TestCitas:
    def test_create_cita(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        paciente = baker.make(Paciente)
        colaborador = baker.make(Colaborador)
        servicio = baker.make(Servicio, precio=100.00)
        aperitivo = baker.make(Aperitivo, precio=10.00)
        data = {
            "paciente_id": paciente.id,
            "colaborador_id": colaborador.id,
            "servicio_id": servicio.id,
            "aperitivos": [aperitivo.id],
            "fecha_hora": "2026-08-01",
            "hora": "10:00:00",
            "notas": "Cita de prueba",
        }
        response = client.post("/api/citas/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Cita.objects.count() == 1
        assert response.data["saldo_pend"] == "110.00"

    def test_update_cita_status(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        cita = baker.make(Cita, estado="PEND")
        response = client.patch(
            f"/api/citas/{cita.id}/", {"estado": "REAL"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        cita.refresh_from_db()
        assert cita.estado == "REAL"

    def test_delete_cita_blocked(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        cita = baker.make(Cita)
        response = client.delete(f"/api/citas/{cita.id}/")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        assert Cita.objects.filter(id=cita.id).exists()


class TestHistoriasClinicas:
    def test_get_historia_clinica(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        historia = baker.make(HistoriaClinica)
        response = client.get(f"/api/historias/{historia.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == historia.id

    def test_generate_pdf(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        paciente = baker.make(Paciente, nombres="Ana", apellidos="García")
        response = client.get(f"/api/historias/paciente/{paciente.id}/pdf/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
