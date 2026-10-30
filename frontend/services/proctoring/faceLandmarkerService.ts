/**
 * Face Landmarker Service
 * MediaPipe FaceLandmarker for extracting eye coordinates, head orientation, and facial keypoints.
 */

export class FaceLandmarkerService {
  private landmarker: any = null;
  private isInitializing = false;
  private fallbackActive = false;

  public async initialize(): Promise<void> {
    if (this.landmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 2,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      console.log("[FaceLandmarkerService] MediaPipe FaceLandmarker initialized");
    } catch (err) {
      console.warn("[FaceLandmarkerService] Landmarker GPU error, falling back to CPU or estimation:", err);
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numFaces: 2
        });
      } catch (cpuErr) {
        console.warn("[FaceLandmarkerService] Offline estimation mode active:", cpuErr);
        this.fallbackActive = true;
      }
    } finally {
      this.isInitializing = false;
    }
  }

  public detectLandmarks(videoEl: HTMLVideoElement, timestampMs: number): any {
    if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }
    if (this.landmarker && !this.fallbackActive) {
      try {
        return this.landmarker.detectForVideo(videoEl, timestampMs);
      } catch (err) {
        console.warn("[FaceLandmarkerService] Landmarker frame detection error:", err);
      }
    }
    return null;
  }

  public close(): void {
    if (this.landmarker && this.landmarker.close) {
      try {
        this.landmarker.close();
      } catch {}
      this.landmarker = null;
    }
  }
}
