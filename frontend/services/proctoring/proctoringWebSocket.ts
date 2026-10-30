/**
 * Proctoring WebSocket Client
 * Maintains bi-directional real-time telemetry link with FastAPI backend.
 */

export interface HeartbeatPayload {
  sessionId: number | string;
  timestamp: string;
  camera: {
    status: string;
    faceCount: number;
    faceConfidence: number;
  };
  gaze: {
    state: string;
    confidence: number;
  };
  browser: {
    focused: boolean;
    fullscreen: boolean;
  };
  network: {
    status: string;
  };
}

export class ProctoringWebSocket {
  private ws: WebSocket | null = null;
  private sessionId: number | string;
  private url: string;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private onWarningCallback?: (msg: string) => void;
  private onStatusChangeCallback?: (connected: boolean) => void;
  private onCommandCallback?: (cmd: any) => void;

  constructor(sessionId: number | string, wsUrl?: string) {
    this.sessionId = sessionId;
    const defaultWs = typeof window !== "undefined"
      ? (window.location.protocol === "https:" ? "wss:" : "ws:") + `//${window.location.hostname}:8000/ws/proctoring/${sessionId}`
      : `ws://127.0.0.1:8000/ws/proctoring/${sessionId}`;
    this.url = wsUrl || defaultWs;
  }

  public connect(
    onWarning?: (msg: string) => void,
    onStatusChange?: (connected: boolean) => void,
    onCommand?: (cmd: any) => void
  ): void {
    this.onWarningCallback = onWarning;
    this.onStatusChangeCallback = onStatusChange;
    this.onCommandCallback = onCommand;
    this.initSocket();
  }

  private initSocket(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[ProctoringWebSocket] Connected to proctoring channel");
        this.reconnectAttempts = 0;
        this.onStatusChangeCallback?.(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.warning) {
            this.onWarningCallback?.(data.warning);
          }
          if (this.onCommandCallback) {
            this.onCommandCallback(data);
          }
        } catch {}
      };

      this.ws.onclose = () => {
        this.onStatusChangeCallback?.(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn("[ProctoringWebSocket] Error:", err);
      };
    } catch (e) {
      console.warn("[ProctoringWebSocket] Initialization failed:", e);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < 6) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      setTimeout(() => this.initSocket(), delay);
    }
  }

  public startHeartbeat(getTelemetry: () => HeartbeatPayload): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const payload = getTelemetry();
        this.ws.send(JSON.stringify(payload));
      }
    }, 10000);
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
