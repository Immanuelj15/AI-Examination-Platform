/**
 * Gaze Estimation Service
 * Estimates head orientation and gaze direction using landmarks or face geometry with temporal smoothing.
 */

import { GazeDirection } from "./types";

export class GazeService {
  private gazeAwayStartTime: number | null = null;
  private currentDirection: GazeDirection = "GAZE_CENTER";
  private directionHistory: GazeDirection[] = [];
  private readonly historyLimit = 8;

  public estimateGaze(landmarksResult: any, primaryBox?: { x: number; y: number; width: number; height: number }): {
    direction: GazeDirection;
    confidence: number;
    gazeAwayDurationMs: number;
    shouldTriggerEvent: boolean;
  } {
    let rawDirection: GazeDirection = "GAZE_CENTER";
    let confidence = 0.85;

    // Check if FaceLandmarker landmarks are available
    if (landmarksResult && landmarksResult.faceLandmarks && landmarksResult.faceLandmarks[0]) {
      const lm = landmarksResult.faceLandmarks[0];
      // Nose tip (index 1), Left eye outer (index 33), Right eye outer (index 263)
      const nose = lm[1];
      const leftEye = lm[33];
      const rightEye = lm[263];

      if (nose && leftEye && rightEye) {
        const eyeCenter = (leftEye.x + rightEye.x) / 2;
        const eyeSpan = Math.abs(rightEye.x - leftEye.x);
        const horizontalRatio = (nose.x - eyeCenter) / (eyeSpan || 0.1);

        if (horizontalRatio < -0.22) {
          rawDirection = "GAZE_LEFT";
          confidence = 0.88;
        } else if (horizontalRatio > 0.22) {
          rawDirection = "GAZE_RIGHT";
          confidence = 0.88;
        } else if (nose.y < (leftEye.y + rightEye.y) / 2 - 0.05) {
          rawDirection = "GAZE_UP";
          confidence = 0.75;
        } else if (nose.y > (leftEye.y + rightEye.y) / 2 + 0.12) {
          rawDirection = "GAZE_DOWN";
          confidence = 0.75;
        } else {
          rawDirection = "GAZE_CENTER";
          confidence = 0.92;
        }
      }
    } else if (primaryBox) {
      // Fallback: estimate from bounding box offset from camera center
      const centerX = primaryBox.x + primaryBox.width / 2;
      const centerY = primaryBox.y + primaryBox.height / 2;

      if (centerX < 0.22) rawDirection = "GAZE_LEFT";
      else if (centerX > 0.78) rawDirection = "GAZE_RIGHT";
      else if (centerY < 0.15) rawDirection = "GAZE_UP";
      else if (centerY > 0.85) rawDirection = "GAZE_DOWN";
      else rawDirection = "GAZE_CENTER";
      confidence = 0.7;
    }

    // Temporal smoothing of gaze direction
    this.directionHistory.push(rawDirection);
    if (this.directionHistory.length > this.historyLimit) {
      this.directionHistory.shift();
    }

    // Determine majority direction in rolling window
    const counts: Record<string, number> = {};
    for (const d of this.directionHistory) {
      counts[d] = (counts[d] || 0) + 1;
    }

    let dominantDirection: GazeDirection = "GAZE_CENTER";
    let maxCount = 0;
    for (const d in counts) {
      if (counts[d] > maxCount) {
        maxCount = counts[d];
        dominantDirection = d as GazeDirection;
      }
    }

    this.currentDirection = dominantDirection;

    // Track persistent gaze away duration
    const now = Date.now();
    let gazeAwayDurationMs = 0;
    let shouldTriggerEvent = false;

    if (this.currentDirection !== "GAZE_CENTER") {
      if (!this.gazeAwayStartTime) {
        this.gazeAwayStartTime = now;
      }
      gazeAwayDurationMs = now - this.gazeAwayStartTime;
      // Trigger event only when gaze away persists beyond 3000ms
      if (gazeAwayDurationMs >= 3000) {
        shouldTriggerEvent = true;
      }
    } else {
      this.gazeAwayStartTime = null;
    }

    return {
      direction: this.currentDirection,
      confidence,
      gazeAwayDurationMs,
      shouldTriggerEvent
    };
  }

  public reset(): void {
    this.gazeAwayStartTime = null;
    this.currentDirection = "GAZE_CENTER";
    this.directionHistory = [];
  }
}
