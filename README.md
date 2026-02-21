# Genius GenAI for Kid

多語言 AI 語音角色陪伴平台，專為 4-6 歲兒童設計。孩子與動畫角色（小熊/兔子/貓咪）用母語對話，AI 以中/英/西語回應。

**本版本無需安裝 Docker**，使用 SQLite 資料庫，一鍵即可啟動。

## 快速啟動

### 前置需求
- Python 3.11+
- Node.js 20+
- OpenAI API Key（必要）

### 步驟

**1. 複製設定檔並填入 API 金鑰**
```bash
cp .env.example apps/backend/.env
# 編輯 apps/backend/.env，填入 OPENAI_API_KEY 等
```

**2. 一鍵啟動（Linux/macOS）**
```bash
./start.sh
```

**Windows：**
```
start.bat
```

**3. 開啟瀏覽器**
```
http://localhost:3000
```

---

## 手動啟動

```bash
# Backend
cd apps/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (另開終端機)
cd apps/parent-ui
npm install
npm run dev
```

## 使用方式

| 角色 | 入口 | 認證方式 |
|------|------|----------|
| 家長 | `http://localhost:3000` → 我是大人 | Email + 密碼 |
| 小朋友 | `http://localhost:3000` → 我是小朋友 | 6 位數密碼 |

1. 家長先註冊帳號
2. 在「孩子管理」建立孩子資料，選擇角色（熊/兔/貓）
3. 取得孩子的 6 位數密碼
4. 在同一個或另一台裝置用 6 位數密碼登入，即可開始語音對話

## 架構

```
apps/
  backend/      FastAPI + SQLite（aiosqlite）
  parent-ui/    Next.js — 家長後台 + 小朋友網頁介面（合一）
  kid-ui/       Expo React Native — 原生手機 App（選用）
```

## 環境變數

| 變數 | 說明 | 必要 |
|------|------|------|
| `OPENAI_API_KEY` | 語音辨識 + 回應 + TTS | ✅ |
| `JWT_SECRET` | 隨機字串 | ✅ |
| `ENCRYPTION_KEY` | Fernet key（見 .env.example） | ✅ |
| `ANTHROPIC_API_KEY` | 可替代 LLM | ❌ |
| `DATABASE_URL` | 預設 SQLite，可改為 PostgreSQL | ❌ |

需要 Docker + PostgreSQL 版本請見 [GenAI-Kid-docker](https://github.com/duncan19760605/GenAI-Kid-docker)
