#!/usr/bin/env bash
set -e

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate

python manage.py createsuperuser --noinput 2>/dev/null || echo "Superuser already exists, skipping"
python manage.py create_supabase_user "${SUPABASE_ADMIN_EMAIL:-admin@bellezaplena.com}" "${SUPABASE_ADMIN_PASSWORD:-admin123}" 2>/dev/null || echo "Supabase user already exists, skipping"
python manage.py enable_rls 2>/dev/null || echo "RLS setup skipped or already applied"
