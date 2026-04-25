# NeuroBalance AI

> **Real-time cognitive stress & mental fatigue detection** — runs entirely in the browser using your webcam. No extra hardware required.

[![FastAPI](https://img.shields.io/badge/AI_Service-FastAPI-009688?logo=fastapi)](http://localhost:8000/docs)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](http://localhost:3000)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_20-339933?logo=node.js)](http://localhost:4000/health)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-4169E1?logo=postgresql)](https://www.postgresql.org/)

---

## Architecture

NeuroBalance AI is a modern monorepo designed for high-performance real-time analysis and beautiful visualization.

```
neuro-balance-ai/
├── apps/
│   ├── web/              # Frontend (Next.js 14, React 18, Recharts)
│   ├── api/              # Backend (Node.js 20, Express, WebSockets)
│   └── extension/        # Chrome Extension (Manifest v3)
├── services/
│   └── ai/               # AI Service (Python 3.11, FastAPI)
├── .env.example
├── docker-compose.yml
└── package.json          # Monorepo management (workspaces)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS 3 |
| **State** | Zustand |
| **Charts** | Recharts |
| **Eye Tracking** | MediaPipe Face Mesh (CDN, in-browser) |
| **Backend** | Node.js 20, Express 4, ws, pg |
| **Auth** | bcryptjs + jsonwebtoken |
| **AI Service** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **Database** | PostgreSQL 15 |
| **Extension** | Chrome Manifest v3 (vanilla JS) |
| **DevOps** | Docker, Docker Compose |

---

## Setup

### Option A — Docker (Recommended)

```bash
git clone <repo-url>
cd neurobalance-ai

cp .env.example .env
# Edit .env if needed

docker-compose up --build
```

Open http://localhost:3000 in your browser.

### Option B — Local Development

This project uses **npm workspaces** for monorepo management.

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start the AI Service
```bash
# In a new terminal
cd services/ai
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Start API and Web services
You can run these using the convenience scripts in the root directory:
```bash
# Start Backend
npm run dev:api

# Start Frontend
npm run dev:web
```

---

## Chrome Extension Setup

1. Open `chrome://extensions` in Chrome
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `apps/extension` folder
5. Click the NeuroBalance icon in your browser toolbar

---

## API Reference

### Auth
```
POST /api/auth/signup    → { token, user }
POST /api/auth/login     → { token, user }
GET  /api/auth/me        → { user, profile }
```

### Data & Analytics
```
POST /api/sessions/start         → { session }
POST /api/sessions/:id/end       → { session }
POST /api/readings               → { reading }
GET  /api/analytics              → { hourly, weekly, today, profile }
```

---

## Privacy

- **All video processing is local.** MediaPipe runs as WebAssembly in your browser.
- **No video data is ever sent** to the backend or AI service.
- Only aggregated metrics (blink rate, gaze direction, etc.) are transmitted.

---

## License

MIT © 2024 NeuroBalance AI
