@echo off
chcp 65001 > nul
echo === Genius GenAI for Kid — 啟動中 ===

cd apps\backend

IF NOT EXIST ".venv" (
  echo [1/4] 建立 Python 虛擬環境...
  python -m venv .venv
)

echo [2/4] 安裝 Python 套件...
call .venv\Scripts\activate.bat
pip install -r requirements.txt -q

IF NOT EXIST ".env" (
  copy ..\..\..\.env.example .env
  echo 請編輯 apps\backend\.env 填入 API 金鑰
  pause
)

echo [3/4] 初始化資料庫 (SQLite)...
alembic upgrade head

echo [4/4] 啟動 Backend (port 8000)...
start "Backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

cd ..\..\apps\parent-ui

IF NOT EXIST "node_modules" (
  echo [5/5] 安裝 Node 套件...
  npm install
)

IF NOT EXIST ".env.local" (
  echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
  echo NEXT_PUBLIC_WS_URL=ws://localhost:8000 >> .env.local
)

echo 啟動網站 (port 3000)...
start "Frontend" cmd /k "npm run dev"

echo.
echo 啟動完成！
echo   網站: http://localhost:3000
echo   API:  http://localhost:8000/docs
echo.
pause
