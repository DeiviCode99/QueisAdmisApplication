import pytest
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestAuthentication:
    def test_no_auth_header(self):
        client = APIClient()
        response = client.get("/api/pacientes/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_malformed_auth_header(self):
        client = APIClient()
        response = client.get("/api/pacientes/", HTTP_AUTHORIZATION="Basic xxx")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_token(self):
        client = APIClient()
        response = client.get(
            "/api/pacientes/", HTTP_AUTHORIZATION="Bearer invalidtoken123"
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestExceptionHandler:
    def test_exception_handler_format(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        data = {"nombres": "A", "apellidos": "B", "celular": "not-a-number"}
        response = client.post("/api/pacientes/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] is True
        assert "detail" in response.data
        assert "code" in response.data
        assert response.data["code"] == 400
        assert "fields" in response.data

    def test_exception_handler_404(self):
        user = User.objects.create_user(username="testuser", password="testpass")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.get("/api/pacientes/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["error"] is True
        assert "detail" in response.data
        assert "code" in response.data
        assert response.data["code"] == 404


class TestThrottle:
    def test_throttle_anon(self):
        client = APIClient()
        limit = 10
        for _ in range(limit):
            response = client.get("/api/tratamientos/")
            assert response.status_code == status.HTTP_200_OK

        response = client.get("/api/tratamientos/")
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

        cache.clear()
