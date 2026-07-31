from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, True),
    DJANGO_SECRET_KEY=(str, 'django-insecure-055!hu!1pa!#(=n%!@iecxazrs(c&ys==pp5&+ud_-s40+lr3='),
    FRONTEND_URL=(str, 'http://localhost:5173'),
    BACKEND_URL=(str, 'http://localhost:8000'),
    SUPABASE_DB_HOST=(str, 'localhost'),
    SUPABASE_DB_PASSWORD=(str, 'root'),
    SUPABASE_JWT_SECRET=(str, ''),
    SUPABASE_PROJECT_REF=(str, ''),
    SUPABASE_ANON_KEY=(str, ''),
    SUPABASE_SERVICE_ROLE=(str, ''),
)

environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('DJANGO_SECRET_KEY')

DEBUG = env('DJANGO_DEBUG')

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    env('BACKEND_URL').replace('https://', '').replace('http://', '').rstrip('/'),
    '.onrender.com',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
    'csp',
    'negocio.apps.NegocioConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'csp.middleware.CSPMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres.uvvsijiwpjbqfqanuzgn',
        'PASSWORD': env('SUPABASE_DB_PASSWORD'),
        'HOST': env('SUPABASE_DB_HOST'),
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    env('FRONTEND_URL'),
]

CSRF_TRUSTED_ORIGINS = [
    env('BACKEND_URL'),
    'https://*.onrender.com',
]

REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'negocio.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'negocio.authentication.SupabaseJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/min',
        'user': '100/min',
        'register': '3/hour',
        'report': '10/hour',
        'login': '20/min',
        'burst': '30/min',
    },
}

SUPABASE_JWT_SECRET = env('SUPABASE_JWT_SECRET')
SUPABASE_PROJECT_REF = env('SUPABASE_PROJECT_REF')
SUPABASE_ANON_KEY = env('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE = env('SUPABASE_SERVICE_ROLE')

# Web Push (VAPID)
VAPID_PRIVATE_KEY = env('VAPID_PRIVATE_KEY').replace('\\n', '\n')
VAPID_PUBLIC_KEY = env('VAPID_PUBLIC_KEY')
VAPID_CLAIMS = {'sub': 'mailto:admin@bellezaplena.com'}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Security Headers
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'same-origin'
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG

# Content Security Policy
supabase_url = f'https://{env("SUPABASE_PROJECT_REF")}.supabase.co'
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'",)
CSP_IMG_SRC = ("'self'", "data:",)
CSP_CONNECT_SRC = ("'self'", supabase_url, env('BACKEND_URL'),)
CSP_FONT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

SPECTACULAR_SETTINGS = {
    'TITLE': 'Belleza Plena SPA API',
    'DESCRIPTION': 'API de gestión para el SPA Belleza Plena',
    'VERSION': '1.0.0',
}
