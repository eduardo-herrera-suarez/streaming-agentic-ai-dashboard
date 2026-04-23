# Streaming Agentic AI Dashboard

> A production-ready React + TypeScript frontend for a real-time Streaming Agentic AI Platform. Features live WebSocket-based streaming chat with token-by-token delta rendering, a real-time system monitoring dashboard, and an embedded Grafana panel — all wired to a FastAPI + Kafka + LangGraph backend.

![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Live%20Streaming-00D4AA?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Overview

This dashboard is the frontend layer of a Streaming Agentic AI Platform that simulates a Netflix/Amazon Prime-style content delivery and support system. The backend runs FastAPI with LangGraph agents, Kafka KRaft, Resilience4j-style circuit breakers, and a full observability stack (Grafana, Prometheus, Loki, Tempo).

This repository contains only the **frontend** — a dark, terminal-meets-fintech UI built with React 18, TypeScript, and Vite.

---

## Features

### Chat Interface (`/`)
- **Real-time streaming** — WebSocket connection to `/api/v1/ws/chat` with JWT authentication
- **Token-by-token rendering** — `delta` messages are appended live with a blinking cursor; the full response is committed on `done`
- **Full message history** — user and assistant messages with timestamps, scroll-to-bottom on new messages
- **Graceful state machine** — `disconnected → connecting → connected → error` states with visual feedback
- **Input UX** — disabled during streaming, Enter to send, auto-focus after response, immediate input clear

### Monitoring Dashboard (`/monitoring`)
- **Live system health** — polls `GET /ready` every 5 seconds with countdown display
- **Metric cards** — system status, environment, Kafka producer state, WebSocket active connections and accounts
- **Circuit breaker grid** — per-breaker OPEN/CLOSED state with color-coded badges (green/red)
- **Grafana embed** — full kiosk iframe rendering the platform's main Grafana dashboard
- **Raw JSON viewer** — collapsible debug pane showing the full `/ready` response

### Design System
- Dark, terminal-meets-fintech aesthetic with `JetBrains Mono` and `Inter`
- Animated status dots, blinking cursors, and smooth message slide-in animations
- Fully responsive grid layouts using CSS `auto-fill` / `minmax`

---

## Architecture

```
Browser (React + Vite)
│
├── /                  Chat Page (App.tsx)
│   └── WebSocket ──→  ws://<backend>/api/v1/ws/chat?token=<JWT>
│         ├── { type: "delta", word: "..." }    → append to stream
│         └── { type: "done", final_response }  → commit message
│
└── /monitoring        Monitoring Page (MonitoringPage.tsx)
    └── HTTP Poll ──→  GET <backend>/ready   (every 5s)
          └── { status, kafka, websocket, circuit_breakers }
              + Grafana iframe → http://localhost:3000/d/streaming-platform-main/...
```

### Backend Stack (separate repo)
| Layer | Technology |
|---|---|
| API Gateway | FastAPI (Python 3.11) |
| AI Agents | LangGraph + LangChain |
| Vector Store | ChromaDB |
| Message Broker | Apache Kafka (KRaft mode) |
| Resilience | Resilience4j-style circuit breakers |
| Observability | Grafana · Prometheus · Loki · Tempo · Langfuse |
| Cache | Redis |
| Database | PostgreSQL |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A running instance of the backend platform on `localhost:8000`
- Grafana on `localhost:3000` (optional — for the embedded dashboard)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/eduardo-herrera-suarez/streaming-agentic-ai-dashboard.git
cd streaming-agentic-ai-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — see Environment Variables below

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
# WebSocket base URL (no trailing slash)
VITE_WS_URL=ws://localhost:8000

# REST API base URL (used by MonitoringPage)
VITE_API_URL=http://localhost:8000

# Grafana dashboard URL (used for the embedded iframe)
VITE_GRAFANA_URL=http://localhost:3000
```

All variables are prefixed with `VITE_` and are inlined at build time by Vite.

---

## Project Structure

```
streaming-agentic-ai-dashboard/
├── public/
├── src/
│   ├── assets/
│   ├── pages/
│   │   ├── MonitoringPage.tsx   # System monitoring dashboard
│   │   └── MonitoringPage.css
│   ├── App.tsx                  # Streaming chat interface
│   ├── App.css                  # Global design system
│   ├── main.tsx
│   ├── router.tsx               # React Router setup
│   └── index.css
├── .env                         # Local environment (gitignored)
├── .env.example                 # Environment variable template
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## WebSocket Protocol

The backend emits three message types over the WebSocket connection:

| Type | Payload | Description |
|---|---|---|
| `delta` | `{ type: "delta", word: string }` | Partial token — append to stream buffer |
| `done` | `{ type: "done", final_response: string }` | Stream complete — commit to message history |
| `error` | `{ type: "error", ... }` | Agent or infrastructure error |

The client sends:

```json
{
  "message": "User's input text",
  "intent": "support"
}
```

Authentication is via JWT passed as a query parameter: `?token=<JWT>`.

---

## Health Endpoint Contract

`GET /ready` returns:

```json
{
  "status": "ok",
  "environment": "development",
  "kafka": {
    "enabled": true,
    "producer": "ok"
  },
  "websocket": {
    "active_connections": 3,
    "active_accounts": 2
  },
  "circuit_breakers": {
    "recommendation_service": { "state": "closed" },
    "payment_service": { "open": false }
  }
}
```

---

## Tech Stack

| | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Styling | Plain CSS with CSS custom properties |
| Fonts | JetBrains Mono · Inter (Google Fonts) |
| Transport | WebSocket (native browser API) |
| Linting | ESLint + TypeScript ESLint |

No UI component library dependencies — fully custom design system.

---

## Author

**Eduardo Herrera** — Building production-grade AI systems from Tijuana, Baja California.
Senior Software Engineer  · AI/ML Engineer

[GitHub](https://github.com/eduardo-herrera-suarez) · [LinkedIn](https://linkedin.com/in/eduardo-herrera-suarez)

---

## License

MIT
