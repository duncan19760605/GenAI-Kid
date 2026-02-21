# 🌟 Genius GenAI for Kid

> 多語言 AI 語音角色陪伴平台，專為 4-6 歲兒童設計

孩子與動畫角色（小熊貝貝、小兔跳跳、小貓咪咪）用母語對話，AI 以中文、英文、西班牙語即時語音回應。父母透過網頁後台管理設定、查看對話記錄與 AI 用量。

**本版本：無需安裝 Docker，使用 SQLite 資料庫，一鍵即可啟動。**

---

## 📸 介面預覽

| 首頁角色選擇 | 小朋友登入 |
|:---:|:---:|
| ![首頁](screenshots/01-home.svg) | ![小朋友登入](screenshots/02-kid-login.svg) |

| 語音對話介面 | 家長後台總覽 |
|:---:|:---:|
| ![語音對話](screenshots/03-kid-chat.svg) | ![家長後台](screenshots/04-parent-dashboard.svg) |

| 孩子管理 |
|:---:|
| ![孩子管理](screenshots/05-parent-children.svg) |

---

## ✨ 功能特色

- 🎤 **語音對話**：按住麥克風說話，角色立即以語音回應
- 🌍 **三語支援**：中文、英文、西班牙語自由切換
- 🐻 **三種角色**：小熊貝貝、小兔跳跳、小貓咪咪，各有 SVG 動畫
- 👨‍👩‍👧 **家長後台**：用量統計、對話記錄、AI 提供者設定
- 🔒 **兒童安全**：內容過濾、PII 檢測、不當話題重導向
- 💾 **SQLite 資料庫**：無需 Docker，開箱即用

---

## 🚀 安裝與啟動

### 第一步：安裝必要工具

#### 1. Git
用來下載（clone）此專案。

- **Windows**：下載並安裝 [Git for Windows](https://git-scm.com/download/win)，安裝時全部選預設即可
- **macOS**：終端機執行 `xcode-select --install`
- **Linux (Ubuntu/Debian)**：`sudo apt install git`

安裝後確認：
```bash
git --version   # 應顯示 git version 2.x.x
```

---

#### 2. Python 3.11+
後端執行環境。

- **Windows**：前往 [python.org/downloads](https://www.python.org/downloads/) 下載 3.11 或更新版本。安裝時 **務必勾選「Add Python to PATH」**
- **macOS**：`brew install python@3.11`（需先安裝 [Homebrew](https://brew.sh/)）
- **Linux**：`sudo apt install python3.11 python3.11-venv python3-pip`

安裝後確認：
```bash
python --version        # Windows
python3 --version       # macOS / Linux
# 應顯示 Python 3.11.x 或更新
```

---

#### 3. Node.js 20+
前端執行環境。

- **所有平台**：前往 [nodejs.org](https://nodejs.org/) 下載 **LTS 版本**（20.x 或更新），依照安裝精靈完成安裝
- **macOS（Homebrew）**：`brew install node`
- **Linux**：
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

安裝後確認：
```bash
node --version   # 應顯示 v20.x.x 或更新
npm --version    # 應顯示 10.x.x 或更新
```

---

#### 4. OpenAI API Key
語音辨識（Whisper）、AI 對話（GPT-4o-mini）、語音合成（TTS）都需要此金鑰。

1. 前往 [platform.openai.com](https://platform.openai.com/) 登入或註冊帳號
2. 點右上角頭像 → **API keys** → **Create new secret key**
3. 複製金鑰（格式：`sk-...`），**關閉前務必複製，之後無法再看到**

---

### 第二步：下載專案

```bash
git clone https://github.com/duncan19760605/GenAI-Kid.git
cd GenAI-Kid
```

---

### 第三步：建立 Python 虛擬環境並安裝套件

> 此步驟安裝後端所需套件（含產生金鑰用的 `cryptography`），須在設定金鑰**之前**完成。

```bash
cd apps/backend

# 建立虛擬環境（只需執行一次）
python -m venv .venv

# 啟用虛擬環境
.venv\Scripts\activate.bat       # Windows
source .venv/bin/activate        # macOS / Linux

# 安裝所有套件（只需執行一次）
pip install -r requirements.txt
```

看到 `Successfully installed ...` 即完成。

---

### 第四步：設定環境變數

回到**專案根目錄**，複製範本設定檔：

```bash
# macOS / Linux（在 GenAI-Kid/ 目錄下執行）
cp .env.example apps/backend/.env

# Windows（在 GenAI-Kid\ 目錄下執行）
copy .env.example apps\backend\.env
```

用文字編輯器開啟 `apps/backend/.env`，依序填入以下欄位：

> ⚠️ 下列金鑰產生指令請在「**命令提示字元**」或「**終端機**」執行，不是 Python 的 `>>>` 互動介面。

**JWT_SECRET**（隨機字串，執行後複製輸出貼入）：
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**ENCRYPTION_KEY**（第三步已安裝 cryptography，可直接執行）：
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**OPENAI_API_KEY**：填入第一步取得的金鑰（`sk-...`）。

完成後 `apps/backend/.env` 應如下：

```env
DATABASE_URL=sqlite+aiosqlite:///./genius_kid.db
JWT_SECRET=（貼上第一段輸出，64 位十六進位字串）
ENCRYPTION_KEY=（貼上第二段輸出，以 = 結尾的 Base64 字串）
OPENAI_API_KEY=sk-...
```

---

### 第五步：啟動應用程式

#### 方式 A：一鍵啟動（推薦）

**Windows：**
```bat
start.bat
```

**macOS / Linux：**
```bash
chmod +x start.sh
./start.sh
```

腳本自動完成：（若尚未建立）建立虛擬環境 → 安裝套件 → 初始化資料庫 → 同時啟動前後端。

---

#### 方式 B：手動分步啟動

確認已完成第三步，開啟**第一個終端機視窗**：

```bash
cd apps/backend

# 啟用虛擬環境
.venv\Scripts\activate.bat       # Windows
source .venv/bin/activate        # macOS / Linux

# 初始化資料庫（只需執行一次，自動建立 genius_kid.db）
alembic upgrade head

# 啟動後端伺服器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

看到 `Uvicorn running on http://0.0.0.0:8000` 表示後端已啟動。

開啟**第二個終端機視窗**：

```bash
cd apps/parent-ui

# 安裝 Node 套件（只需執行一次）
npm install

# 建立前端設定檔（只需執行一次）
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000" >> .env.local

# 啟動前端
npm run dev
```

看到 `Ready on http://localhost:3000` 表示前端已啟動。

---

### 第六步：開啟瀏覽器

```
http://localhost:3000
```

🎉 看到角色選擇畫面即代表安裝成功！

---

## ⚙️ 環境變數說明

編輯 `apps/backend/.env`：

```env
DATABASE_URL=sqlite+aiosqlite:///./genius_kid.db
JWT_SECRET=your-random-64-char-secret

# 生成 Fernet key：
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=your-fernet-key

OPENAI_API_KEY=sk-...
```

---

## 📱 使用流程

### 家長
1. `http://localhost:3000` → **我是大人** → 註冊帳號
2. **孩子管理** → 新增孩子（選角色/語言）
3. 取得孩子的 6 位數登入碼

### 小朋友
1. `http://localhost:3000` → **我是小朋友** → 輸入 6 位碼
2. 按住麥克風說話，放開後等角色回應
3. 底部按鈕：🔁 再說 / 🐢 慢點 / 🌐 換語言 / ❓ 不懂

---

## 🏗️ 專案架構

```
GenAI-Kid/
├── apps/
│   ├── backend/          # FastAPI + SQLite (aiosqlite)
│   │   ├── app/api/      # REST + WebSocket 路由
│   │   ├── app/models/   # SQLAlchemy 模型（Uuid/JSON 跨 DB 型別）
│   │   ├── app/services/ # 語音管線、安全、情緒
│   │   └── app/providers/# AI 提供者（OpenAI/Anthropic）
│   │
│   ├── parent-ui/        # Next.js 16 — 統一網頁（家長+小朋友）
│   │   └── src/
│   │       ├── app/(auth)/      # 登入頁
│   │       ├── app/(dashboard)/ # 家長後台
│   │       └── app/(kid)/       # 小朋友對話介面
│   │
│   └── kid-ui/           # Expo React Native（原生 App，選用）
│
├── start.sh / start.bat  # 一鍵啟動
└── .env.example
```

---

## 🔌 API 文件

啟動後前往：`http://localhost:8000/docs`

---

## 🆚 版本比較

| | 本版 (GenAI-Kid) | Docker 版 (GenAI-Kid-docker) |
|---|---|---|
| 資料庫 | SQLite（自動建立） | PostgreSQL 16 |
| 啟動 | `./start.sh` | `docker compose up` |
| 場景 | 個人開發 / 快速試用 | 正式部署 |

➡️ Docker 版本：[GenAI-Kid-docker](https://github.com/duncan19760605/GenAI-Kid-docker)

---

## 📄 License

MIT
