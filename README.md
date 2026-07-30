# Belleza Plena SPA — Sistema de Gestión

Aplicación web para la gestión integral de un SPA: pacientes, citas, servicios, colaboradores, historias clínicas y reportes mensuales en PDF.

---

## 🏗️ Arquitectura

```
Frontend (Vercel) ──API JWT──▶ Backend (Render) ──SQL──▶ Supabase PostgreSQL
                        │                                       │
                        └── Supabase Auth (JWT ES256) ──────────┘
```

| Capa | Tecnología | Hosting |
|---|---|---|
| **Frontend** | React 19 + Vite + TailwindCSS | Vercel |
| **Backend** | Django 6.0 + Django REST Framework | Render (Gunicorn) |
| **Base de Datos** | PostgreSQL 17 | Supabase |
| **Autenticación** | Supabase Auth (JWT ES256) + SimpleJWT (HS256 fallback) | Supabase |
| **PDF** | ReportLab | Render (server-side) |

[Ver diagrama completo](docs/architecture.md)

---

## 🚀 Deploy

### Backend (Render)
1. Conectar repositorio a Render
2. Configurar:
   - **Root Directory**: `BACKEND`
   - **Build Command**: `bash setup.sh`
   - **Start Command**: `gunicorn backend.wsgi --bind 0.0.0.0:$PORT`
3. Agregar variables de entorno (ver `.env.example`)
4. El script `setup.sh` ejecuta automáticamente:
   - `pip install`, `collectstatic`, `migrate`
   - `createsuperuser` (usa `DJANGO_SUPERUSER_*` env vars)
   - `create_supabase_user` para Supabase Auth
   - `enable_rls` para activar Row Level Security

### Frontend (Vercel)
1. Conectar repositorio a Vercel
2. Configurar:
   - **Root Directory**: `FRONTEND/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Agregar variables de entorno (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Vercel deploya automáticamente en cada push

---

## 🛡️ Seguridad

| Medida | Implementación |
|---|---|
| **RLS (Row Level Security)** | `python manage.py enable_rls` — `deny_all` en todas las tablas públicas de Supabase |
| **CORS** | `django-cors-headers` — solo el origen del frontend permitido |
| **CSP** | `django-csp` — scripts, estilos y conexiones restringidas a orígenes conocidos |
| **HSTS** | `Strict-Transport-Security: max-age=31536000` (1 año) |
| **HTTPS forzado** | `SECURE_SSL_REDIRECT` activo en producción |
| **Cookies seguras** | `SESSION_COOKIE_SECURE` + `CSRF_COOKIE_SECURE` + `SESSION_COOKIE_HTTPONLY` |
| **Proxy SSL** | `SECURE_PROXY_SSL_HEADER` para Render |
| **JWT** | Doble validación: Supabase ES256 vía JWKS + SimpleJWT HS256 legacy |

---

## 📦 Dependencias principales

### Backend (`BACKEND/requirements.txt`)
- Django 6.0, DRF, djangorestframework-simplejwt
- django-cors-headers, django-csp, django-environ
- psycopg2-binary (PostgreSQL), whitenoise (static)
- gunicorn (servidor WSGI)
- reportlab (PDF), drf-spectacular (Swagger)
- cryptography, PyJWT

### Frontend (`FRONTEND/frontend/package.json`)
- React 19, react-router-dom v6
- @supabase/supabase-js, axios
- tailwindcss, lucide-react
- react-toastify, date-fns
- jspdf, html2canvas, @react-pdf/renderer

---

## 🧪 Desarrollo local

```bash
# Backend
cd BACKEND
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver

# Frontend
cd FRONTEND/frontend
npm install
npm run dev
```

---

## 📚 API Docs

- Swagger UI: `https://<backend>/api/docs/`
- ReDoc: `https://<backend>/api/redoc/`
- Schema: `https://<backend>/api/schema/`

---

## 📄 Licencia

Uso interno — SPA Belleza Plena
