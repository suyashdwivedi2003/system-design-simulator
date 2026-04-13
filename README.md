# ⬡ SysDesignAI — AI-Powered System Design Simulator

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://system-design-simulator-beryl.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple?style=for-the-badge&logo=railway)](https://system-design-simulator-production-6c8f.up.railway.app/health)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/suyashdwivedi2003/system-design-simulator)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> A full-stack real-time web application for designing, simulating, and evaluating distributed system architectures — powered by AI.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

SysDesignAI allows engineers and students to visually design distributed system architectures using a drag-and-drop canvas, run realistic load test simulations, and receive AI-powered evaluations of their designs.

The application models real-world infrastructure behavior — demonstrating the performance impact of architectural decisions such as adding load balancers, caches, message queues, and CDNs — all without requiring actual server infrastructure.

The backend pipeline mirrors production-grade patterns used by companies like Uber, Discord, and Slack:

```
Browser → REST API → BullMQ Queue → Worker Process → Redis Pub/Sub → Socket.io → Browser
```

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://system-design-simulator-beryl.vercel.app |
| Backend Health | https://system-design-simulator-production-6c8f.up.railway.app/health |
| GitHub | https://github.com/suyashdwivedi2003/system-design-simulator |

---

## Features

### 🗺️ Architecture Canvas
- Drag-and-drop components onto a free-form canvas
- Available components: Client, Load Balancer, App Server, Database, Cache (Redis), Message Queue, CDN, Microservice
- Connect components with directional arrows using Shift + Click
- Real-time architecture summary in the sidebar

### 📊 Real-Time Load Testing
- Select from predefined scenarios: Twitter Clone (500K users), Netflix (1M users), Uber (200K users), E-Commerce (100K users)
- Live metric streaming via WebSocket — updates every 500ms
- Metrics tracked: Latency (ms), Error Rate (%), Throughput (RPS), Active Users
- Architecture-aware simulation: each component affects performance mathematically
- Results persisted to PostgreSQL after each test

### 🤖 AI Architecture Evaluation
- Server-side Groq API integration (Llama 3.3 70B)
- Structured evaluation with: Overall Score (/100), Strengths, Critical Issues, Recommendations, Scalability Verdict
- API key secured server-side — never exposed to the browser

### 💾 Saved Designs
- Save architecture designs to PostgreSQL
- Load any saved design back onto the canvas
- View full test history per design with scores and metrics

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (Vercel)                   │
│   React + Vite │ Socket.io Client │ Recharts             │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP + WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                   BACKEND SERVER (Railway)               │
│   Express REST API │ Socket.io Server │ CORS             │
└────────┬─────────────────────────────────────┬──────────┘
         │ BullMQ                               │ Redis Pub/Sub
┌────────▼────────┐                   ┌────────▼──────────┐
│  BULL WORKER    │                   │   REDIS (Railway) │
│  Load Test Jobs │──── Publishes ───▶│   Pub/Sub Broker  │
│  60 ticks/job   │                   │   Job Queue Store │
└────────┬────────┘                   └───────────────────┘
         │ Saves results
┌────────▼────────┐
│  POSTGRESQL     │
│  (Railway)      │
│  architectures  │
│  test_results   │
└─────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | Component-driven UI with fast HMR |
| Socket.io Client | Real-time WebSocket communication |
| Recharts | Live data visualization charts |
| Tailwind CSS | Utility-first styling |
| JetBrains Mono | Monospace typography |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Socket.io | Bidirectional WebSocket server |
| BullMQ | Distributed job queue for async processing |
| Redis | Pub/sub pipeline + job queue store + caching |
| PostgreSQL | Persistent storage for designs and results |

### AI Integration
| Technology | Purpose |
|---|---|
| Groq API | LLM inference (Llama 3.3 70B) |
| Prompt Engineering | Structured architecture evaluation |

### Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Frontend hosting + CDN |
| Railway | Backend, worker, Redis, PostgreSQL |
| Docker Compose | Local development orchestration |
| GitHub | Version control |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for local Redis + PostgreSQL)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/suyashdwivedi2003/system-design-simulator.git
cd system-design-simulator
```

**2. Start databases with Docker**
```bash
cd backend
docker compose up -d
```

**3. Configure environment variables**
```bash
# backend/.env
cp .env.example .env
# Fill in your GROQ_API_KEY
```

```bash
# vite-project/.env
VITE_BACKEND_URL=http://localhost:3001
```

**4. Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend
cd ../vite-project && npm install
```

**5. Start all services**

Open 3 terminals:

```bash
# Terminal 1 — Backend server
cd backend && npm run dev

# Terminal 2 — Bull worker
cd backend && npm run worker

# Terminal 3 — Frontend
cd vite-project && npm run dev
```

**6. Open the application**
```
http://localhost:5173
```

---

## Project Structure

```
system-design-simulator/
│
├── backend/
│   ├── db/
│   │   ├── redis.js          # Redis client + pub/sub helpers
│   │   └── postgres.js       # PostgreSQL connection + schema
│   ├── routes/
│   │   ├── architecture.js   # CRUD endpoints for designs
│   │   └── loadtest.js       # Load test queue + AI review
│   ├── services/
│   │   ├── simulator.js      # Load test math engine
│   │   └── aiService.js      # Groq API integration
│   ├── workers/
│   │   └── loadTestWorker.js # BullMQ job processor
│   ├── server.js             # Express + Socket.io entry point
│   ├── docker-compose.yml    # Redis + PostgreSQL containers
│   └── package.json
│
└── vite-project/
    └── src/
        ├── components/
        │   ├── Canvas.jsx           # Drag-and-drop architecture builder
        │   ├── MetricsDashboard.jsx # Live charts
        │   ├── AIEvaluator.jsx      # AI review panel
        │   └── SavedDesigns.jsx     # Design history from PostgreSQL
        ├── hooks/
        │   └── useSocket.js         # WebSocket connection hook
        ├── utils/
        │   ├── constants.js         # Component definitions + scenarios
        │   ├── simulator.js         # Client-side fallback math
        │   └── prompts.js           # AI prompt builder
        └── App.jsx                  # Root component
```

---

## How It Works

### Load Test Pipeline

1. User clicks **Run Test** → browser POSTs to `/api/loadtest/start`
2. Backend creates a unique `jobId` and adds it to the BullMQ queue
3. Browser joins a Socket.io room identified by `jobId`
4. Bull worker picks up the job and runs 60 ticks at 500ms intervals
5. Each tick generates metrics based on the architecture components
6. Worker publishes metrics to Redis channel `job:<jobId>:metrics`
7. Server bridges Redis → Socket.io → browser (live chart updates)
8. On completion, results are saved to PostgreSQL and a summary is broadcast

### Architecture Scoring

Each component modifies the base metrics:

| Component | Effect |
|---|---|
| Load Balancer | −25% latency, −40% error rate, +40% throughput per server |
| Cache (Redis) | −45% latency, +80% throughput |
| Message Queue | −60% error rate, +15ms latency overhead |
| CDN | −30% latency, +30% throughput |
| Additional Servers | −8% latency, −12% error rate per server |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/architecture` | Save architecture design |
| `GET` | `/api/architecture` | List all saved designs |
| `GET` | `/api/architecture/:id` | Get design by ID |
| `GET` | `/api/architecture/:id/results` | Get test history for design |
| `POST` | `/api/loadtest/start` | Queue a new load test |
| `POST` | `/api/loadtest/ai` | Run AI architecture review |
| `GET` | `/api/loadtest/status/:jobId` | Check job status |

### WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `join_test` | Client → Server | Subscribe to a test's updates |
| `metric_update` | Server → Client | Live metric data point |
| `test_complete` | Server → Client | Final summary + score |

---

## Deployment

The application is deployed across two platforms:

| Service | Platform | Configuration |
|---|---|---|
| Frontend | Vercel | Root: `vite-project`, Framework: Vite |
| Backend + Worker | Railway | Root: `backend`, separate services |
| PostgreSQL | Railway | Managed database |
| Redis | Railway | Managed Redis instance |

### Environment Variables

**Backend:**
```env
PORT=3001
NODE_ENV=production
REDIS_URL=<Railway Redis URL>
DATABASE_URL=<Railway PostgreSQL URL>
GROQ_API_KEY=<Groq API key>
FRONTEND_URL=<Vercel deployment URL>
```

**Frontend:**
```env
VITE_BACKEND_URL=<Railway backend URL>
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/suyashdwivedi2003">Suyash Dwivedi</a></p>
  <p>
    <a href="https://system-design-simulator-beryl.vercel.app">Live Demo</a> ·
    <a href="https://github.com/suyashdwivedi2003/system-design-simulator/issues">Report Bug</a> ·
    <a href="https://github.com/suyashdwivedi2003/system-design-simulator/issues">Request Feature</a>
  </p>
</div>
