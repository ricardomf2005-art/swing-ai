#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        SwingAI - Golf Analyzer       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Backend
echo "▶ Iniciando backend Python..."
cd "$(dirname "$0")/backend"

if [ ! -d ".venv" ]; then
  echo "  Creando entorno virtual..."
  python3 -m venv .venv
fi

source .venv/bin/activate
echo "  Instalando dependencias Python..."
pip install -q -r requirements.txt

echo "  Lanzando FastAPI en puerto 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Frontend
echo ""
echo "▶ Iniciando frontend Next.js..."
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Instalando dependencias npm..."
  npm install
fi

echo "  Lanzando Next.js en puerto 3000..."
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Aplicación lista:"
echo "   → Frontend: http://localhost:3000"
echo "   → Backend:  http://localhost:8000"
echo "   → API docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
