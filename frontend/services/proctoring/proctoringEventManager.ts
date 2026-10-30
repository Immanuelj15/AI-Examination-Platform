/**
 * Proctoring Event Manager
 * Debounces events with cooldowns, batches discrete occurrences, and dispatches to FastAPI backend.
 */

import { ProctorEvent, ProctorEventType, EventSeverity } from "./types";

export class ProctoringEventManager {
  private sessionId: number | string;
  private apiBaseUrl: string;
  private lastTriggerTimes: Record<string, number> = {};
  private eventHistory: ProctorEvent[] = [];
  private onEventListener?: (event: ProctorEvent) => void;

  private readonly cooldowns: Record<string, number> = {
    TAB_SWITCH: 3000,
    WINDOW_BLUR: 3000,
    WINDOW_FOCUS: 2000,
    FULLSCREEN_EXIT: 3000,
    FACE_ABSENT: 5000,
    FACE_RESTORED: 3000,
    MULTIPLE_FACE_DETECTED: 5000,
    MULTIPLE_FACE_RESTORED: 3000,
    GAZE_AWAY: 3000,
    CAMERA_DISCONNECTED: 4000,
    CAMERA_RESTORED: 2000,
    NETWORK_INTERRUPTED: 4000,
    NETWORK_RESTORED: 2000
  };

  constructor(sessionId: number | string, apiBaseUrl: string = "http://127.0.0.1:8000/api/v1") {
    this.sessionId = sessionId;
    this.apiBaseUrl = apiBaseUrl;
  }

  public setEventListener(listener: (event: ProctorEvent) => void): void {
    this.onEventListener = listener;
  }

  public async emitEvent(
    type: ProctorEventType,
    durationMs?: number,
    confidence?: number,
    faceCount?: number,
    metadata?: Record<string, unknown>
  ): Promise<ProctorEvent | null> {
    const now = Date.now();
    const last = this.lastTriggerTimes[type] || 0;
    const cooldown = this.cooldowns[type] || 2500;

    if (now - last < cooldown) {
      return null; // Debounced
    }
    this.lastTriggerTimes[type] = now;

    // Severity classification
    let severity: EventSeverity = "MEDIUM";
    if (type.includes("RESTORED") || type === "WINDOW_FOCUS") {
      severity = "INFO";
    } else if (type === "GAZE_AWAY" || type === "NETWORK_INTERRUPTED") {
      severity = "LOW";
    } else if (type === "MULTIPLE_FACE_DETECTED" || type === "TAB_SWITCH" || type === "FULLSCREEN_EXIT") {
      severity = "HIGH";
    }

    const event: ProctorEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: this.sessionId,
      type,
      severity,
      timestamp: new Date().toISOString(),
      durationMs,
      confidence,
      faceCount,
      metadata
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 50) this.eventHistory.pop();

    this.onEventListener?.(event);

    // Asynchronously dispatch to FastAPI backend
    this.dispatchToBackend(event).catch(err => {
      console.warn("[ProctoringEventManager] Failed to dispatch event:", err);
    });

    return event;
  }

  private async dispatchToBackend(event: ProctorEvent): Promise<void> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalora_token") : null;
      await fetch(`${this.apiBaseUrl}/proctoring/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          event_type: event.type,
          severity: event.severity,
          duration_ms: event.durationMs,
          confidence: event.confidence,
          face_count: event.faceCount,
          metadata: event.metadata
        })
      });
    } catch (e) {
      // Non-blocking error handling
      console.warn("[ProctoringEventManager] Network error sending event:", e);
    }
  }

  public getHistory(): ProctorEvent[] {
    return this.eventHistory;
  }
}
