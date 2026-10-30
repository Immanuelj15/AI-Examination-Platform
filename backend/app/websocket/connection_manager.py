import json
from typing import List, Dict, Any, Optional
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Global monitoring dashboards (Admin / Examiner overview)
        self.active_connections: List[WebSocket] = []
        # Per-session student socket mapping: session_id -> List[WebSocket]
        self.session_connections: Dict[str, List[WebSocket]] = {}
        # Per-session examiner/supervisor sockets: session_id -> List[WebSocket]
        self.supervisor_connections: Dict[str, List[WebSocket]] = {}
        # Mobile 2nd screen camera streams: session_id -> WebSocket
        self.mobile_camera_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    # --- Student Session Sockets ---
    async def connect_session(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.session_connections:
            self.session_connections[session_id] = []
        self.session_connections[session_id].append(websocket)

    def disconnect_session(self, websocket: WebSocket, session_id: str):
        if session_id in self.session_connections:
            if websocket in self.session_connections[session_id]:
                self.session_connections[session_id].remove(websocket)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]

    async def send_to_session(self, session_id: str, message: Dict[str, Any]):
        """Send command (warning, freeze, unfreeze, terminate, chat) directly to candidate."""
        if session_id in self.session_connections:
            dead = []
            for ws in self.session_connections[session_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead.append(ws)
            for d in dead:
                self.disconnect_session(d, session_id)

    # --- Examiner / Supervisor Sockets ---
    async def connect_supervisor(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.supervisor_connections:
            self.supervisor_connections[session_id] = []
        self.supervisor_connections[session_id].append(websocket)

    def disconnect_supervisor(self, websocket: WebSocket, session_id: str):
        if session_id in self.supervisor_connections:
            if websocket in self.supervisor_connections[session_id]:
                self.supervisor_connections[session_id].remove(websocket)
            if not self.supervisor_connections[session_id]:
                del self.supervisor_connections[session_id]

    async def send_to_supervisors(self, session_id: str, message: Dict[str, Any]):
        """Forward candidate telemetry/alerts to observing examiners."""
        if session_id in self.supervisor_connections:
            dead = []
            for ws in self.supervisor_connections[session_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead.append(ws)
            for d in dead:
                self.disconnect_supervisor(d, session_id)

    # --- Mobile Dual-Camera WebRTC Pairing ---
    async def connect_mobile(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.mobile_camera_connections[session_id] = websocket

    def disconnect_mobile(self, session_id: str):
        if session_id in self.mobile_camera_connections:
            del self.mobile_camera_connections[session_id]

    async def broadcast(self, message: Dict[str, Any]):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead.append(connection)
        for d in dead:
            if d in self.active_connections:
                self.active_connections.remove(d)

manager = ConnectionManager()
