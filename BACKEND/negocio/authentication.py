import jwt
from jwt import PyJWKClient
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


_jwks_client = None


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        url = f'https://{settings.SUPABASE_PROJECT_REF}.supabase.co/auth/v1/.well-known/jwks.json'
        _jwks_client = PyJWKClient(url, cache_keys=True)
    return _jwks_client


class SupabaseJWTAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def authenticate(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth.startswith('Bearer '):
            return None

        token = auth[7:]

        try:
            header = jwt.get_unverified_header(token)
            alg = header.get('alg', 'HS256')
        except Exception:
            return None

        try:
            if alg == 'HS256':
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=['HS256'],
                    options={'verify_exp': True, 'verify_aud': False},
                )
            else:
                signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=[alg],
                    options={'verify_exp': True, 'verify_aud': False},
                )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired')
        except jwt.InvalidTokenError:
            return None

        email = payload.get('email', '')
        sub = payload.get('sub', '')

        if not email:
            email = f'{sub[:8]}@supabase.user'

        user, _ = User.objects.get_or_create(
            username=f'supabase_{sub[:12]}',
            defaults={'email': email, 'is_active': True},
        )

        return (user, token)
