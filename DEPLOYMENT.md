# Evalora Enterprise Deployment & Operations Guide

This guide covers deployment strategies, environment hardening, database maintenance, and security best practices for running Evalora in production environments.

---

## 1. Architecture Overview

In a typical production environment, Evalora runs with:
- **Nginx / Cloud Load Balancer:** Terminating TLS/SSL, routing static frontend vs `/api/` traffic, managing WebSocket upgrades.
- **Next.js Frontend Container:** Multi-stage Alpine container running on Node 20.
- **FastAPI Backend Cluster:** Gunicorn/Uvicorn workers configured according to CPU core count.
- **PostgreSQL Database:** Managed RDS or dedicated PostgreSQL 16 cluster with connection pooling.
- **Redis Cluster:** Managing real-time WebSocket session tracking, rate limiting, and cache.

---

## 2. Docker Compose Production Deployment

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` in root and configure secrets:
```bash
cp .env.example .env
```
Ensure the following are set to secure values:
- `JWT_SECRET`: Minimum 64 random characters.
- `JWT_REFRESH_SECRET`: Minimum 64 random characters.
- `POSTGRES_PASSWORD`: Strong database password.
- `OPENAI_API_KEY`: Valid key if AI subjective evaluation is enabled.

### Step 2: Launch Stack
```bash
docker-compose up -d --build
```

### Step 3: Run Database Migrations
```bash
docker-compose exec backend alembic upgrade head
```

### Step 4: Seed Initial Data (Optional for new setups)
```bash
docker-compose exec backend python seed.py
```

### Step 5: Check Service Health
```bash
docker-compose ps
curl -f http://localhost/health
```

---

## 3. Production Environment Hardening

### 1. Database Indexing & Optimization
The database schema includes pre-configured B-Tree indexes on high-throughput lookup fields:
- `users(email)`, `users(role)`
- `exams(code)`, `exams(status)`, `exams(created_at)`
- `exam_sessions(student_id)`, `exam_sessions(exam_id)`, `exam_sessions(status)`
- `answers(session_id)`, `answers(question_id)`
- `proctor_events(session_id)`, `proctor_events(timestamp)`
- `audit_logs(user_id)`, `audit_logs(created_at)`

For PostgreSQL tuning (`postgresql.conf`):
- `max_connections = 300`
- `shared_buffers = 25% of RAM`
- `effective_cache_size = 75% of RAM`
- `work_mem = 16MB`

### 2. TLS/SSL & Reverse Proxy Security
Ensure Nginx is equipped with Let's Encrypt / Certbot SSL certificates:
```nginx
server {
    listen 443 ssl http2;
    server_name evalora.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/evalora.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/evalora.yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" always;
}
```

### 3. File Upload Security (Handwritten Submissions)
- Verify MIME types strictly against `image/jpeg`, `image/png`, and `image/webp`.
- Enforce max size limit (e.g., 10MB per submission).
- Store uploads with cryptographically generated UUIDs in AWS S3 or Cloudflare R2 with restricted public write access.

---

## 4. Disaster Recovery & Backups

### Automated PostgreSQL Backup Cron
```bash
# Nightly backup script
pg_dump -U evalora -h localhost evalora_db | gzip > /backups/evalora_$(date +\%F_\%T).sql.gz
find /backups/ -type f -mtime +30 -name '*.sql.gz' -delete
```

### Session Invalidation & Emergency Disqualification
Administrators can immediately disconnect or disqualify compromised exam sessions via the Live Exam Monitoring dashboard or directly via the API:
```http
POST /api/v1/proctoring/sessions/{session_id}/disqualify
Authorization: Bearer <ADMIN_OR_EXAMINER_TOKEN>
```

---

## 5. Monitoring & Observability

- **API Health Endpoint:** `GET /health` returns DB connectivity and version info.
- **WebSocket Endpoint:** `/ws/live-monitoring` handles real-time proctoring updates.
- **OpenAPI / Swagger:** Accessible at `/docs` (disable in public production if required by company policy).
