#!/bin/bash
set -e

echo "=== Genius GenAI for Kid — 啟動中 ==="

# ── Backend ──────────────────────────────────────────────────────────────────
cd apps/backend

if [ ! -d ".venv" ]; then
  echo "[1/4] 建立 Python 虛擬環境..."
  python3 -m venv .venv
fi

echo "[2/4] 安裝 Python 套件..."
source .venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp ../../.env.example .env
  echo "⚠️  請編輯 apps/backend/.env 填入 API 金鑰"
fi

echo "[3/4] 初始化資料庫 (SQLite)..."
alembic upgrade head

echo "[4/4] 啟動 Backend (port 8000)..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ../..

# ── Parent UI ─────────────────────────────────────────────────────────────────
cd apps/parent-ui

if [ ! -d "node_modules" ]; then
  echo "[5/5] 安裝 Node 套件..."
  npm install
fi

if [ ! -f ".env.local" ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
  echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000" >> .env.local
fi

echo "啟動網站 (port 3000)..."
npm run dev &
WEB_PID=$!

echo ""
echo "✅ 啟動完成！"
echo "   網站: http://localhost:3000"
echo "   API:  http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服務"

trap "kill $BACKEND_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait
