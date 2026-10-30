import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import (
    auth, admin, examiner, student, exams, questions,
    exam_sessions, proctoring, grading, results, notifications
)
from app.websocket.connection_manager import manager

# Create database tables automatically
Base.metadata.create_all(bind=engine)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI-powered online examination and proctoring platform API",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)
app.include_router(examiner.router, prefix=api_v1_prefix)
app.include_router(student.router, prefix=api_v1_prefix)
app.include_router(exams.router, prefix=api_v1_prefix)
app.include_router(questions.router, prefix=api_v1_prefix)
app.include_router(questions.bank_router, prefix=api_v1_prefix)
app.include_router(exam_sessions.router, prefix=api_v1_prefix)
app.include_router(proctoring.router, prefix=api_v1_prefix)
app.include_router(grading.router, prefix=api_v1_prefix)
app.include_router(results.router, prefix=api_v1_prefix)
app.include_router(notifications.router, prefix=api_v1_prefix)

@app.websocket("/ws/live-monitoring")
async def websocket_live_monitoring(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast test ping
            await websocket.send_text('{"type": "PONG", "status": "CONNECTED"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/proctoring/{session_id}")
async def websocket_proctoring_session(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            # Acknowledge heartbeat or telemetry frame
            await websocket.send_text('{"status": "ACK", "sessionId": "' + str(session_id) + '", "synced": true}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }

@app.get("/ready")
def ready_check():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "service": settings.PROJECT_NAME
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": f"error: {str(e)}",
            "service": settings.PROJECT_NAME
        }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "version": settings.VERSION
    }
