#!/usr/bin/env bash
set -e

MODE="${1:-dev}"

if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "=== Iniciando con Docker ==="
    if [ "$MODE" = "prod" ]; then
        docker compose up --build -d
    else
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    fi
else
    echo "=== Iniciando sin Docker (desarrollo directo) ==="
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:5173"

    # Backend
    echo "--- Instalando dependencias del backend ---"
    cd BACKEND
    python -m venv venv 2>/dev/null || true
    source venv/bin/activate 2>/dev/null || .\\venv\\Scripts\\activate 2>/dev/null || true
    pip install -r requirements.txt
    pip install -r requirements-dev.txt 2>/dev/null || true
    python manage.py migrate
    python manage.py collectstatic --noinput
    echo "--- Iniciando backend ---"
    python manage.py runserver 0.0.0.0:8000 &
    BACKEND_PID=$!

    # Frontend
    echo "--- Instalando dependencias del frontend ---"
    cd ../FRONTEND/frontend
    npm install
    echo "--- Iniciando frontend ---"
    npm run dev &
    FRONTEND_PID=$!

    echo "PIDs: backend=$BACKEND_PID frontend=$FRONTEND_PID"
    echo "Presiona Ctrl+C para detener ambos servicios."

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    wait
fi
