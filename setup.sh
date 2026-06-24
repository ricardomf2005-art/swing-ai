#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    SwingAI — Setup inicial               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

ROOT="$(dirname "$0")"

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 no encontrado. Instálalo desde https://python.org"
  exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js no encontrado. Instálalo desde https://nodejs.org"
  exit 1
fi

echo "✓ Python $(python3 --version)"
echo "✓ Node $(node --version)"
echo ""

# Backend
echo "▶ Configurando backend..."
cd "$ROOT/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt
echo "✓ Backend listo"

# Frontend
echo ""
echo "▶ Configurando frontend..."
cd "$ROOT/frontend"
npm install
echo "✓ Frontend listo"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Setup completado. Para iniciar:         ║"
echo "║    bash start.sh                         ║"
echo "╚══════════════════════════════════════════╝"
