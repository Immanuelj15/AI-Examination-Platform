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
    await manager.connect_session(websocket, session_id)
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                parsed = json.loads(raw_data)
                # Forward candidate telemetry/alerts to active proctors & live dashboards
                parsed["sessionId"] = str(session_id)
                await manager.send_to_supervisors(session_id, parsed)
                await manager.broadcast({
                    "type": "PROCTOR_TELEMETRY",
                    "sessionId": str(session_id),
                    "data": parsed
                })
            except Exception:
                pass
            # Acknowledge heartbeat or telemetry frame
            await websocket.send_text('{"status": "ACK", "sessionId": "' + str(session_id) + '", "synced": true}')
    except WebSocketDisconnect:
        manager.disconnect_session(websocket, session_id)

@app.websocket("/ws/proctor-intervention/{session_id}")
async def websocket_proctor_intervention(websocket: WebSocket, session_id: str):
    """Examiner intervention channel: send broadcast warnings, freeze screen, or chat directly."""
    await manager.connect_supervisor(websocket, session_id)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                cmd = json.loads(raw)
                # Forward examiner command (WARNING, FREEZE, UNFREEZE, TERMINATE, CHAT) to candidate session
                await manager.send_to_session(session_id, cmd)
                # Echo confirmation back to examiner
                await websocket.send_text(json.dumps({
                    "status": "DELIVERED",
                    "command": cmd.get("action"),
                    "sessionId": session_id
                }))
            except Exception as e:
                await websocket.send_text(json.dumps({"status": "ERROR", "detail": str(e)}))
    except WebSocketDisconnect:
        manager.disconnect_supervisor(websocket, session_id)

@app.websocket("/ws/dual-camera/{session_id}")
async def websocket_dual_camera(websocket: WebSocket, session_id: str):
    """Mobile secondary-screen camera stream channel for 360-degree room proctoring."""
    await manager.connect_mobile(websocket, session_id)
    try:
        while True:
            frame_data = await websocket.receive_text()
            # Relay mobile camera frame signal to candidate's main screen and observing supervisors
            msg = {
                "type": "MOBILE_CAMERA_FRAME",
                "sessionId": session_id,
                "payload": frame_data
            }
            await manager.send_to_session(session_id, msg)
            await manager.send_to_supervisors(session_id, msg)
    except WebSocketDisconnect:
        manager.disconnect_mobile(session_id)
        # Notify candidate and examiners that secondary camera dropped
        drop_notice = {
            "type": "MOBILE_CAMERA_DISCONNECTED",
            "sessionId": session_id,
            "warning": "Secondary mobile camera disconnected. Please reconnect your mobile camera."
        }
        await manager.send_to_session(session_id, drop_notice)
        await manager.send_to_supervisors(session_id, drop_notice)

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
