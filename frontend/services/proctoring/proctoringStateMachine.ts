/**
 * Fault-Tolerant Proctoring State Machine
 * Implements rolling temporal smoothing, persistence thresholds, hysteresis, and smooth face tracking.
 */

import {
  ProctoringState,
  ProctoringConfig,
  DEFAULT_PROCTORING_CONFIG,
  BoundingBox,
  DetectedFace,
  ProctorEventType
} from "./types";

interface DetectionSnapshot {
  timestamp: number;
  faceCount: number;
  confidence: number;
  box?: BoundingBox;
}

export interface StateMachineListener {
  onStateChange: (newState: ProctoringState, previousState: ProctoringState) => void;
  onWarning: (message: string, level: "INFO" | "WARN" | "FLAG") => void;
  onEvent: (type: ProctorEventType, durationMs?: number, confidence?: number, faceCount?: number, meta?: Record<string, unknown>) => void;
}

export class ProctoringStateMachine {
  private currentState: ProctoringState = "INITIALIZING";
  private config: ProctoringConfig;
  private listeners: StateMachineListener[] = [];

  // Rolling detection window for temporal smoothing
  private history: DetectionSnapshot[] = [];

  // Temporal persistence timers & markers
  private absenceStartTime: number | null = null;
  private multipleStartTime: number | null = null;
  private recoveryStartTime: number | null = null;
  private hasEmittedAbsentEvent = false;
  private hasEmittedMultipleEvent = false;

  // Smoothed bounding box for tracking stability (anti-jitter)
  private smoothedBox: BoundingBox | null = null;

  constructor(customConfig?: Partial<ProctoringConfig>) {
    this.config = { ...DEFAULT_PROCTORING_CONFIG, ...customConfig };
  }

  public subscribe(listener: StateMachineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getState(): ProctoringState {
    return this.currentState;
  }

  public getSmoothedBox(): BoundingBox | null {
    return this.smoothedBox;
  }

  private transitionTo(newState: ProctoringState): void {
    if (this.currentState === newState) return;
    const oldState = this.currentState;
    this.currentState = newState;
    this.listeners.forEach(l => l.onStateChange(newState, oldState));
  }

  /**
   * Evaluates camera frame detections against temporal history, persistence rules, and hysteresis.
   */
  public processFrame(faces: DetectedFace[], now: number = Date.now()): {
    state: ProctoringState;
    facePositionStatus: "GOOD" | "TOO_FAR" | "TOO_CLOSE" | "OFF_CENTER" | "PARTIAL_OUTSIDE" | "NONE";
    presenceRatio: number;
    multipleRatio: number;
    averageConfidence: number;
    smoothedBox: BoundingBox | null;
  } {
    const rawCount = faces.length;
    const primaryFace = faces[0];
    const rawConfidence = primaryFace ? primaryFace.confidence : 0.0;

    // 1. Maintain Rolling History Window
    this.history.push({
      timestamp: now,
      faceCount: rawCount,
      confidence: rawConfidence,
      box: primaryFace ? primaryFace.box : undefined
    });

    if (this.history.length > this.config.windowSize) {
      this.history.shift();
    }

    // 2. Calculate Temporal Ratios
    let presentCount = 0;
    let multipleCount = 0;
    let confidenceSum = 0;

    for (const snap of this.history) {
      if (snap.faceCount >= 1 && snap.confidence >= this.config.facePresenceConfidence) {
        presentCount++;
      }
      if (snap.faceCount >= 2) {
        multipleCount++;
      }
      confidenceSum += snap.confidence;
    }

    const windowLen = Math.max(1, this.history.length);
    const presenceRatio = presentCount / windowLen;
    const multipleRatio = multipleCount / windowLen;
    const averageConfidence = confidenceSum / windowLen;

    // 3. Smooth Bounding Box with Exponential Moving Average (EMA)
    if (primaryFace && primaryFace.box) {
      const b = primaryFace.box;
      if (!this.smoothedBox) {
        this.smoothedBox = { ...b };
      } else {
        const alpha = 0.35; // Smoothing factor
        this.smoothedBox = {
          x: this.smoothedBox.x * (1 - alpha) + b.x * alpha,
          y: this.smoothedBox.y * (1 - alpha) + b.y * alpha,
          width: this.smoothedBox.width * (1 - alpha) + b.width * alpha,
          height: this.smoothedBox.height * (1 - alpha) + b.height * alpha
        };
      }
    } else if (presenceRatio < 0.2) {
      this.smoothedBox = null;
    }

    // 4. Face Position & Distance Quality Check
    let facePositionStatus: "GOOD" | "TOO_FAR" | "TOO_CLOSE" | "OFF_CENTER" | "PARTIAL_OUTSIDE" | "NONE" = "NONE";
    if (this.smoothedBox) {
      const box = this.smoothedBox;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      if (box.width > 0.72 || box.height > 0.8) {
        facePositionStatus = "TOO_CLOSE";
      } else if (box.width < 0.15 || box.height < 0.18) {
        facePositionStatus = "TOO_FAR";
      } else if (centerX < 0.18 || centerX > 0.82 || centerY < 0.18 || centerY > 0.82) {
        facePositionStatus = "OFF_CENTER";
      } else if (box.x < 0.02 || box.x + box.width > 0.98 || box.y < 0.02) {
        facePositionStatus = "PARTIAL_OUTSIDE";
      } else {
        facePositionStatus = "GOOD";
      }
    }

    // 5. State Machine Evaluation with Persistence & Hysteresis

    // Case A: Multiple Faces Scenario (>= 2 faces)
    if (rawCount >= 2 && multipleRatio >= 0.4) {
      this.absenceStartTime = null;

      if (!this.multipleStartTime) {
        this.multipleStartTime = now;
        this.transitionTo("MULTIPLE_FACE_UNCERTAIN");
      }

      const elapsedMultiple = now - this.multipleStartTime;

      if (elapsedMultiple >= this.config.multipleFaceEventMs) {
        this.transitionTo("MULTIPLE_FACE_DETECTED");
        if (!this.hasEmittedMultipleEvent) {
          this.hasEmittedMultipleEvent = true;
          this.listeners.forEach(l => {
            l.onWarning("Multiple people detected in camera frame. Session flagged for review.", "FLAG");
            l.onEvent("MULTIPLE_FACE_DETECTED", elapsedMultiple, averageConfidence, rawCount);
          });
        }
      } else if (elapsedMultiple >= this.config.multipleFaceWarningMs) {
        this.transitionTo("MULTIPLE_FACE_WARNING");
        this.listeners.forEach(l => {
          l.onWarning("Multiple faces detected. Please ensure you are alone in the test area.", "WARN");
        });
      }
      return { state: this.currentState, facePositionStatus, presenceRatio, multipleRatio, averageConfidence, smoothedBox: this.smoothedBox };
    }

    // Multiple faces cleared -> evaluate recovery with hysteresis (must remain single face for restoreStabilityMs)
    if (this.hasEmittedMultipleEvent && rawCount <= 1) {
      if (!this.recoveryStartTime) {
        this.recoveryStartTime = now;
      } else if (now - this.recoveryStartTime >= this.config.restoreStabilityMs) {
        this.hasEmittedMultipleEvent = false;
        this.multipleStartTime = null;
        this.recoveryStartTime = null;
        this.listeners.forEach(l => {
          l.onWarning("Single candidate presence verified.", "INFO");
          l.onEvent("MULTIPLE_FACE_RESTORED", 0, averageConfidence, 1);
        });
      }
    } else if (rawCount <= 1) {
      this.multipleStartTime = null;
    }

    // Case B: Face Absent Scenario (0 faces or very low confidence)
    const isTemporarilyAbsent = rawCount === 0 || (presenceRatio < 0.3 && averageConfidence < 0.4);

    if (isTemporarilyAbsent) {
      this.recoveryStartTime = null;

      if (!this.absenceStartTime) {
        this.absenceStartTime = now;
        this.transitionTo("FACE_UNCERTAIN");
      }

      const elapsedAbsence = now - this.absenceStartTime;

      if (elapsedAbsence >= this.config.faceAbsenceEventMs) {
        this.transitionTo("FACE_ABSENT");
        if (!this.hasEmittedAbsentEvent) {
          this.hasEmittedAbsentEvent = true;
          this.listeners.forEach(l => {
            l.onWarning("Candidate face not detected for an extended duration. Flagged for review.", "FLAG");
            l.onEvent("FACE_ABSENT", elapsedAbsence, 0.0, 0);
          });
        }
      } else if (elapsedAbsence >= this.config.faceAbsenceWarningMs) {
        this.transitionTo("FACE_ABSENT_WARNING");
        this.listeners.forEach(l => {
          l.onWarning("Please keep your face fully visible in front of the camera.", "WARN");
        });
      }
      return { state: this.currentState, facePositionStatus, presenceRatio, multipleRatio, averageConfidence, smoothedBox: this.smoothedBox };
    }

    // Case C: Face Present / Restored Scenario (1 Face with adequate confidence)
    if (presenceRatio >= 0.5) {
      this.absenceStartTime = null;

      // Hysteresis for exiting FACE_ABSENT state
      if (this.hasEmittedAbsentEvent) {
        if (!this.recoveryStartTime) {
          this.recoveryStartTime = now;
        } else if (now - this.recoveryStartTime >= this.config.restoreStabilityMs) {
          this.hasEmittedAbsentEvent = false;
          this.recoveryStartTime = null;
          this.transitionTo("FACE_PRESENT");
          this.listeners.forEach(l => {
            l.onWarning("Candidate presence restored.", "INFO");
            l.onEvent("FACE_RESTORED", 0, averageConfidence, 1);
          });
        }
      } else {
        this.recoveryStartTime = null;
        this.transitionTo("FACE_PRESENT");
      }
    }

    return {
      state: this.currentState,
      facePositionStatus,
      presenceRatio,
      multipleRatio,
      averageConfidence,
      smoothedBox: this.smoothedBox
    };
  }

  public reset(): void {
    this.currentState = "INITIALIZING";
    this.history = [];
    this.absenceStartTime = null;
    this.multipleStartTime = null;
    this.recoveryStartTime = null;
    this.hasEmittedAbsentEvent = false;
    this.hasEmittedMultipleEvent = false;
    this.smoothedBox = null;
  }
}
