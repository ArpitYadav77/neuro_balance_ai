# NeuroBalance AI

> **Real-time cognitive stress & mental fatigue detection** — runs entirely in the browser using your webcam. No extra hardware required.

[![FastAPI](https://img.shields.io/badge/AI_Service-FastAPI-009688?logo=fastapi)](http://localhost:8000/docs)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](http://localhost:3000)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_20-339933?logo=node.js)](http://localhost:4000/health)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-4169E1?logo=postgresql)](https://www.postgresql.org/)

---

## Product Overview

NeuroBalance AI passively monitors a user's cognitive state during screen usage using their webcam. It detects **blink rate**, **eye gaze direction**, and **eye closure percentage** using **MediaPipe Face Mesh** running directly in the browser (JavaScript). These signals feed into a rule-based stress scoring engine (Python/FastAPI) that outputs a real-time stress score from 0–100.

The system provides personalized interventions (breathing exercises, break reminders, posture alerts), adapts to each user's baseline over time, and presents all data in a beautiful, analytics-rich dashboard.

---

## Architecture

```
Browser (Next.js 14)
  │── MediaPipe FaceMesh (CDN, in-browser, 30fps)
  │── WebSocket → ws://localhost:4000/ws
  │
Node.js Backend (Express + ws)
  │── PostgreSQL 15 (sessions, readings, profiles, interventions)
  │── HTTP POST → http://localhost:8000/predict-stress
  │
Python FastAPI AI Service
  └── Rule-based stress scoring (0–100)

Chrome Extension (Manifest v3)
  └── Screen time tracking + intervention overlays on any site
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS 3 |
| State | Zustand |
| Charts | Recharts |
| Eye Tracking | MediaPipe Face Mesh (CDN, in-browser) |
| Backend | Node.js 20, Express 4, ws, pg |
| Auth | bcryptjs + jsonwebtoken |
| AI Service | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| Database | PostgreSQL 15 |
| Extension | Chrome Manifest v3 (vanilla JS) |
| DevOps | Docker, Docker Compose |

---

## Prerequisites

- **Docker + Docker Compose** (recommended)  
  OR:
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+

---

## Setup

### Option A — Docker (Recommended)

```bash
git clone <repo-url>
cd neurobalance

cp .env.example .env
# Edit .env if needed

docker-compose up --build
```

Open http://localhost:3000 in your browser.

### Option B — Manual Setup

#### 1. Start PostgreSQL and create database

```bash
psql -U postgres
CREATE DATABASE neurobalance;
CREATE USER neuro WITH PASSWORD 'neuropass';
GRANT ALL PRIVILEGES ON DATABASE neurobalance TO neuro;
\q
```

#### 2. Start the AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Verify: http://localhost:8000/health

#### 3. Start the Backend

```bash
cd backend
npm install

# Create .env file
cp ../.env.example .env
# Edit DATABASE_URL to use localhost if not using Docker

npm run dev
```

Verify: http://localhost:4000/health

#### 4. Start the Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:4000" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:4000" >> .env.local

npm run dev
```

Open: http://localhost:3000

---

## Chrome Extension Setup

1. Open `chrome://extensions` in Chrome
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `/extension` folder
5. Click the NeuroBalance icon in your browser toolbar
6. Enter your account credentials to link the extension
7. The extension will now track screen time on all sites and show interventions

---

## Data Flow

```
1. User opens /dashboard → auth check → POST /api/sessions/start → receive sessionId
2. Click "Start Monitoring" → getUserMedia() → MediaPipe FaceMesh initializes
3. Every frame (30fps): compute EAR → detect blink → compute gaze direction
4. Every 1 second: aggregate metrics → send via WebSocket:
   { type: "eye_metrics", data: { blinkRate, gazeDirection, eyeClosure, screenTimeMinutes, gazeShifts } }
5. Backend receives → fetches user profile (baseline) → POST to FastAPI /predict-stress
6. FastAPI computes weighted score → returns { stressScore, level, components, recommendations }
7. Backend forwards to client via WebSocket: { type: "stress_result", data: {...} }
8. Frontend: update Zustand store → animate StressRing → append to history chart
9. Every 10 seconds: POST /api/readings to save to PostgreSQL
10. If stressScore > threshold: Backend sends { type: "intervention", data: {...} }
11. Frontend: show InterventionToast → user responds → PATCH /api/interventions/:id/respond
12. Backend: update behavior_logs → adjust threshold if user consistently ignores
13. Session end: POST /api/sessions/:id/end → compute session stats → update user baseline
14. Dashboard reloads analytics from GET /api/analytics
```

---

## Stress Scoring Algorithm

**Input signals:** blink rate, gaze direction, eye closure %, screen time, gaze shifts, user baseline

| Signal | Weight | Logic |
|--------|--------|-------|
| Blink Rate | 30% | Normal = 15 bpm; deviation from normal = score. <8 bpm = +20 penalty |
| Screen Time | 30% | Linear 0→90 min; >45 min = +20 penalty |
| Gaze Instability | 25% | Shifts/min × 70; not center = +15 |
| Eye Closure | 15% | > 40% closure linearly maps to score |

**Personalization:** `adjustment = (40 - userBaseline) × 0.3` — adapts to each user's natural state.

**Output:** `stressScore` (0–100), `level` (low/medium/high), component breakdown, recommendations.

---

## API Reference

### Auth
```
POST /api/auth/signup    → { token, user }
POST /api/auth/login     → { token, user }
GET  /api/auth/me        → { user, profile }
```

### Sessions & Data
```
POST /api/sessions/start         → { session }
POST /api/sessions/:id/end       → { session }
POST /api/readings               → { reading }
GET  /api/analytics              → { hourly, weekly, today, profile, recentInterventions }
POST /api/interventions          → { intervention }
PATCH /api/interventions/:id/respond → { intervention }
PATCH /api/settings              → { profile }
```

### AI Service
```
GET  /health                     → { status }
POST /predict-stress             → { stressScore, level, components, recommendations }
WS   /ws/stress                  → real-time streaming
```

---

## WebSocket Protocol

**Client → Server:**
```json
{ "type": "eye_metrics", "data": { "blinkRate": 14, "gazeDirection": "center", "eyeClosure": 0.2, "screenTimeMinutes": 12, "gazeShifts": 3 } }
{ "type": "session_time_alert", "data": { "minutes": 45, "currentScore": 72 } }
{ "type": "intervention_response", "data": { "interventionId": "uuid", "response": "accepted" } }
```

**Server → Client:**
```json
{ "type": "connected", "data": { "userId": "uuid" } }
{ "type": "stress_result", "data": { "stressScore": 58.3, "level": "medium", "components": {...}, "recommendations": [...] } }
{ "type": "intervention", "data": { "trigger": "high_stress", "stressScore": 78, "interventions": [...] } }
```

---

## Privacy

- **All video processing is local.** MediaPipe runs as WebAssembly in your browser.
- **No video data is ever sent** to the backend or AI service.
- Only aggregated metrics (blink rate, gaze direction, etc.) are transmitted.
- Metrics are numbers — not biometric data.

---

## Project Structure

```
neurobalance/
├── docker-compose.yml
├── .env.example
├── README.md
├── frontend/          ← Next.js 14 + TypeScript + Tailwind
├── backend/           ← Node.js + Express + WebSockets + pg
├── ai-service/        ← Python FastAPI stress scoring engine
└── extension/         ← Chrome Extension Manifest v3
```

---

## License

MIT © 2024 NeuroBalance AI
