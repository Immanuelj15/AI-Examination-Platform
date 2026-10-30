/**
 * Standardized Proctoring Types & Interfaces
 * Production-grade architecture with fault-tolerant state tracking.
 */

export type ProctoringState =
  | "INITIALIZING"
  | "CAMERA_REQUESTING"
  | "CAMERA_READY"
  | "SYSTEM_CHECK"
  | "FACE_SEARCHING"
  | "FACE_PRESENT"
  | "FACE_UNCERTAIN"
  | "FACE_ABSENT_WARNING"
  | "FACE_ABSENT"
  | "MULTIPLE_FACE_UNCERTAIN"
  | "MULTIPLE_FACE_WARNING"
  | "MULTIPLE_FACE_DETECTED"
  | "CAMERA_ERROR"
  | "NETWORK_ERROR"
  | "MONITORING"
  | "EXAM_COMPLETED";

export type ProctorEventType =
  | "FACE_ABSENT"
  | "FACE_RESTORED"
  | "MULTIPLE_FACE_DETECTED"
  | "MULTIPLE_FACE_RESTORED"
  | "GAZE_AWAY"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_EXIT"
  | "CAMERA_DISCONNECTED"
  | "CAMERA_RESTORED"
  | "NETWORK_INTERRUPTED"
  | "NETWORK_RESTORED";

export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProctorEvent {
  id: string;
  sessionId: number | string;
  type: ProctorEventType;
  severity: EventSeverity;
  timestamp: string;
  durationMs?: number;
  confidence?: number;
  faceCount?: number;
  metadata?: Record<string, unknown>;
}

export type GazeDirection =
  | "GAZE_CENTER"
  | "GAZE_LEFT"
  | "GAZE_RIGHT"
  | "GAZE_UP"
  | "GAZE_DOWN"
  | "GAZE_UNKNOWN";

export interface BoundingBox {
  x: number;      // 0 to 1 normalized
  y: number;      // 0 to 1 normalized
  width: number;  // 0 to 1 normalized
  height: number; // 0 to 1 normalized
}

export interface DetectedFace {
  box: BoundingBox;
  confidence: number;
  landmarks?: { x: number; y: number; z?: number }[];
}

export interface FrameDetectionResult {
  timestamp: number;
  faceCount: number;
  faces: DetectedFace[];
  primaryFaceConfidence: number;
  primaryFaceBox?: BoundingBox;
  gazeDirection: GazeDirection;
  gazeConfidence: number;
  facePositionStatus: "GOOD" | "TOO_FAR" | "TOO_CLOSE" | "OFF_CENTER" | "PARTIAL_OUTSIDE" | "NONE";
}

export interface CameraQualityMetrics {
  brightness: number; // 0 - 255
  contrast: number;   // standard deviation
  resolution: { width: number; height: number };
  status: "GOOD" | "TOO_DARK" | "TOO_BRIGHT" | "LOW_RESOLUTION";
  feedbackMessage?: string;
}

export interface ProctoringConfig {
  faceDetectionConfidence: number;      // Default 0.65
  facePresenceConfidence: number;       // Default 0.65
  faceTrackingConfidence: number;       // Default 0.60
  faceAbsenceWarningMs: number;         // Default 3000ms
  faceAbsenceEventMs: number;           // Default 5000ms
  multipleFaceWarningMs: number;        // Default 1500ms
  multipleFaceEventMs: number;          // Default 2500ms
  gazeWarningMs: number;                // Default 1500ms
  gazeEventMs: number;                  // Default 3000ms
  restoreStabilityMs: number;           // Default 1000ms (hysteresis)
  windowSize: number;                   // Default 10 frames rolling history
  targetDetectionFps: number;           // Default 12 FPS
  heartbeatIntervalSeconds: number;     // Default 10 seconds
}

export const DEFAULT_PROCTORING_CONFIG: ProctoringConfig = {
  faceDetectionConfidence: 0.65,
  facePresenceConfidence: 0.65,
  faceTrackingConfidence: 0.60,
  faceAbsenceWarningMs: 3000,
  faceAbsenceEventMs: 5000,
  multipleFaceWarningMs: 1500,
  multipleFaceEventMs: 2500,
  gazeWarningMs: 1500,
  gazeEventMs: 3000,
  restoreStabilityMs: 1000,
  windowSize: 10,
  targetDetectionFps: 12,
  heartbeatIntervalSeconds: 10
};
