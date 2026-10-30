# Evalora | Enterprise Assessment Cloud & AI Proctoring Platform

Evalora is a modern, production-grade, enterprise-scale online examination and assessment SaaS platform engineered for universities, recruitment teams, and modern certification bodies.

Inspired by the information architecture, operational rigor, and reliability of leading assessment technologies, Evalora delivers an uncompromising assessment lifecycle: from multi-step randomized exam authoring to client-side AI computer-vision proctoring, LLM-assisted subjective answer grading, human examiner review, and percentile analytics.

---

## 🏛️ System Architecture

```text
                  ┌───────────────────────────────┐
                  │   PUBLIC CORPORATE PLATFORM   │
                  │   Hero | Solutions | Trust    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   ROLE-AWARE AUTHENTICATION   │
                  │  JWT | Refresh | RBAC Guards  │
                  └───────────────┬───────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
     ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
     │  ADMIN CLOUD  │    │   EXAMINER    │    │ STUDENT CLOUD │
     │  Users & Orgs │    │ Exam Creation │    │ Hardware Chk  │
     │ Live Monitor  │    │ Question Bank │    │ Exam Engine   │
     │ Platform Logs │    │ AI Evaluation │    │ PWA & Local   │
     │ Analytics     │    │ Score Approve │    │ Results & Cert│
     └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ▼
     ┌────────────────────────────────────────────────────────┐
     │                REAL-TIME & AI CORE                     │
     │  FastAPI | PostgreSQL | WebSockets | MediaPipe Vision  │
     │  Authoritative Server Timer | GPT-4o-mini Evaluation   │
     └────────────────────────────────────────────────────────┘
```

---

## 🎨 Brand & Visual Identity

- **Visual Direction:** Corporate, White & Deep Navy Blue identity with high-contrast accessibility.
- **Primary Navy:** `#123B7A`
- **Secondary Blue:** `#2563EB`
- **Background Slate:** `#F8FAFC`
- **Typography:** Modern clean sans-serif (Inter / System UI) with strict WCAG AA contrast.
- **Micro-Animations:** Framer Motion transitions with reduced-motion support.

---

## 🔐 User Roles & Default Test Credentials

All accounts are pre-populated via the idempotent database seed script (`backend/seed.py`):

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `admin123` | Platform oversight, user & org management, live monitoring, audit logs, global settings |
| **EXAMINER** | `examiner@example.com` | `examiner123` | Multi-step exam authoring, question banks (MCQ, Multi-select, Short/Long, Coding, Image), AI grading review |
| **STUDENT** | `student@example.com` | `student123` | System hardware check, timed exam engine, local answer synchronization, comprehensive results |

---

## 🚀 Key Feature Highlights

### 1. Multi-Format Question Engine
- **MCQ & Multi-Select:** Instant client/server validation, negative marking support, randomized options.
- **Short & Long Answer:** Rich subjective inputs, AI concept matching, rubric alignment.
- **Coding Assessment:** Built-in code workspace with starter templates, language selection, syntax preservation.
- **Handwritten / Image Submissions:** Secure upload validation, image viewer with examiner zoom & review tools.

### 2. Client-Side AI Proctoring (Zero Raw Video Streaming)
- Lightweight client-side computer-vision telemetry detecting:
  - Face absence & multi-person intrusion
  - Head pose & persistent gaze away
  - Window blur, tab switching, and fullscreen lock breaches
- Continuous 10-second heartbeat pushing derived security events to `/api/v1/proctoring/heartbeat`.
- Real-time suspicion scoring (0–100) strictly hidden from the candidate to prevent gamification or panic.

### 3. AI-Assisted Subjective Evaluation (LLM)
- Evaluates candidate short & long answers against official **Model Answers** and **Grading Rubrics**.
- Returns recommended score, confidence percentage, matched concepts, and missing concepts.
- **Human-in-the-Loop:** AI scores serve as advisory recommendations that examiners can approve, override, or annotate before publishing.

### 4. Resilient Exam Engine & Server-Authoritative Time
- Server-calculated remaining duration prevents client-side clock tampering.
- Incremental automatic answer persistence to backend and isolated `localStorage` backups.
- **Offline Shield:** If network connectivity drops, the engine displays an unobtrusive alert, locks local inputs safely, and automatically resynchronizes once back online.
- Automatic zero-click submission when the exam timer expires.

### 5. Multilingual Interface (i18n)
Full internationalization across 6 languages:
- 🌐 **English** (en)
- 🇮🇳 **Tamil** (தமிழ்)
- 🇮🇳 **Hindi** (हिन्दी)
- 🇮🇳 **Malayalam** (മലയാളം)
- 🇮🇳 **Telugu** (తెలుగు)
- 🇮🇳 **Kannada** (ಕನ್ನಡ)

### 6. Progressive Web App (PWA)
- Installable standalone application.
- Service worker (`/sw.js`) with static asset caching and offline fallback (`/offline.html`).
- Mobile-optimized touch controls, sticky timers, and responsive grids.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion, Recharts.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 ORM, Alembic, Pydantic V2, WebSockets, Python-Jose (JWT).
- **Database:** PostgreSQL (production) / SQLite (zero-setup development).
- **Load Testing:** Locust.
- **DevOps:** Docker, Docker Compose, Nginx Reverse Proxy, GitHub Actions CI/CD.

---

## 🏃 Local Development Quickstart

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- Git

### 1. Clone & Set Up Backend

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed realistic demo data
python seed.py

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Set Up Frontend

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 🧪 Testing Suite

### Unit & Integration Tests (Backend)
```bash
cd backend
pytest -v tests/
```

### Concurrent Load Testing (Locust)
Simulate 100 to 1,000+ concurrent examinees submitting incremental answers and proctoring heartbeats:
```bash
cd backend
locust -f tests/load_test_locust.py --host=http://localhost:8000
```
Open `http://localhost:8089` to configure user spawn rates and analyze latency distribution.

---

## 📦 Production Deployment via Docker Compose

```bash
# Build and run the entire stack (PostgreSQL, Redis, Backend, Frontend, Nginx)
docker-compose up -d --build
```
Access the application at `http://localhost`.

---

## 📄 License
Enterprise Assessment Cloud Software License. Built for Infosys Springboard Evaluation.
