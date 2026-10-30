/**
 * useProctoring Hook
 * Production React hook integrating Camera, MediaPipe Vision, State Machine, Browser Tracking, and WebSockets.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ProctoringState,
  ProctorEventType,
  GazeDirection,
  BoundingBox,
  CameraQualityMetrics,
  ProctorEvent,
  ProctoringConfig,
  DEFAULT_PROCTORING_CONFIG
} from "@/services/proctoring/types";
import { CameraService } from "@/services/proctoring/cameraService";
import { CameraQualityService } from "@/services/proctoring/cameraQualityService";
import { FaceDetectionService } from "@/services/proctoring/faceDetectionService";
import { FaceLandmarkerService } from "@/services/proctoring/faceLandmarkerService";
import { GazeService } from "@/services/proctoring/gazeService";
import { BrowserMonitoringService } from "@/services/proctoring/browserMonitoringService";
import { ProctoringStateMachine } from "@/services/proctoring/proctoringStateMachine";
import { ProctoringEventManager } from "@/services/proctoring/proctoringEventManager";
import { ProctoringWebSocket } from "@/services/proctoring/proctoringWebSocket";

interface UseProctoringOptions {
  sessionId: number | string;
  configuration?: Partial<ProctoringConfig>;
  apiBaseUrl?: string;
  wsUrl?: string;
  onWarning?: (msg: string) => void;
}

export function useProctoring({
  sessionId,
  configuration,
  apiBaseUrl = "http://127.0.0.1:8000/api/v1",
  wsUrl,
  onWarning
}: UseProctoringOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Core status states
  const [cameraStatus, setCameraStatus] = useState<"INITIALIZING" | "ACTIVE" | "DISCONNECTED" | "ERROR">("INITIALIZING");
  const [proctoringState, setProctoringState] = useState<ProctoringState>("INITIALIZING");
  const [faceCount, setFaceCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0.0);
  const [gazeState, setGazeState] = useState<GazeDirection>("GAZE_CENTER");
  const [facePositionStatus, setFacePositionStatus] = useState<"GOOD" | "TOO_FAR" | "TOO_CLOSE" | "OFF_CENTER" | "PARTIAL_OUTSIDE" | "NONE">("NONE");
  const [smoothedBox, setSmoothedBox] = useState<BoundingBox | null>(null);
  const [cameraQuality, setCameraQuality] = useState<CameraQualityMetrics | null>(null);
  const [activeWarnings, setActiveWarnings] = useState<string[]>([]);
  const [events, setEvents] = useState<ProctorEvent[]>([]);
  const [fps, setFps] = useState(0);
  const [detectionLatencyMs, setDetectionLatencyMs] = useState(0);
  const [webSocketConnected, setWebSocketConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Service singletons
  const cameraServiceRef = useRef<CameraService>(new CameraService());
  const qualityServiceRef = useRef<CameraQualityService>(new CameraQualityService());
  const faceDetectorRef = useRef<FaceDetectionService>(new FaceDetectionService());
  const landmarkerRef = useRef<FaceLandmarkerService>(new FaceLandmarkerService());
  const gazeServiceRef = useRef<GazeService>(new GazeService());
  const browserMonitorRef = useRef<BrowserMonitoringService>(new BrowserMonitoringService());
  const stateMachineRef = useRef<ProctoringStateMachine>(new ProctoringStateMachine(configuration));
  const eventManagerRef = useRef<ProctoringEventManager>(new ProctoringEventManager(sessionId, apiBaseUrl));
  const wsClientRef = useRef<ProctoringWebSocket>(new ProctoringWebSocket(sessionId, wsUrl));

  const animFrameIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(true);

  const addWarning = useCallback((msg: string) => {
    setActiveWarnings(prev => {
      if (prev.includes(msg)) return prev;
      return [...prev.slice(-2), msg];
    });
    onWarning?.(msg);
  }, [onWarning]);

  const clearWarning = useCallback((index: number) => {
    setActiveWarnings(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Initialize and run vision loop
  useEffect(() => {
    isRunningRef.current = true;
    let frameCounter = 0;
    let lastFpsTime = Date.now();
    let lastProcessTime = 0;
    let targetInterval = 1000 / (configuration?.targetDetectionFps || DEFAULT_PROCTORING_CONFIG.targetDetectionFps);

    // Event listener subscription
    eventManagerRef.current.setEventListener(ev => {
      setEvents(prev => [ev, ...prev.slice(0, 19)]);
    });

    stateMachineRef.current.subscribe({
      onStateChange: (newState) => {
        setProctoringState(newState);
      },
      onWarning: (msg, level) => {
        addWarning(msg);
      },
      onEvent: (type, durationMs, confidence, count, meta) => {
        eventManagerRef.current.emitEvent(type, durationMs, confidence, count, meta);
      }
    });

    // Start browser monitoring
    browserMonitorRef.current.start((type, meta) => {
      eventManagerRef.current.emitEvent(type, 0, 1.0, undefined, meta);
      if (type === "TAB_SWITCH") {
        addWarning("Tab switch detected. Please stay focused on the assessment.");
      } else if (type === "FULLSCREEN_EXIT") {
        addWarning("Fullscreen mode exited. Please restore fullscreen.");
      }
    });

    // Start WebSocket
    wsClientRef.current.connect(
      (warning) => addWarning(warning),
      (connected) => setWebSocketConnected(connected)
    );

    wsClientRef.current.startHeartbeat(() => ({
      sessionId,
      timestamp: new Date().toISOString(),
      camera: {
        status: cameraStatus,
        faceCount,
        faceConfidence
      },
      gaze: {
        state: gazeState,
        confidence: 0.88
      },
      browser: {
        focused: browserMonitorRef.current.isDocumentFocused(),
        fullscreen: browserMonitorRef.current.isFullscreen()
      },
      network: {
        status: navigator.onLine ? "ONLINE" : "OFFLINE"
      }
    }));

    // Setup Camera & Vision Models
    const setupVision = async () => {
      if (!videoRef.current) return;
      try {
        await cameraServiceRef.current.initializeCamera(
          videoRef.current,
          () => {
            setCameraStatus("DISCONNECTED");
            eventManagerRef.current.emitEvent("CAMERA_DISCONNECTED");
            addWarning("Camera disconnected. Please reconnect your video device.");
          },
          () => {
            setCameraStatus("ACTIVE");
            eventManagerRef.current.emitEvent("CAMERA_RESTORED");
            addWarning("Camera connection restored.");
          }
        );
        setIsStreaming(true);
        setCameraStatus("ACTIVE");

        // Initialize detectors asynchronously
        await Promise.allSettled([
          faceDetectorRef.current.initialize(),
          landmarkerRef.current.initialize()
        ]);

        loop();
      } catch (err) {
        console.warn("[useProctoring] Camera setup error:", err);
        setCameraStatus("ERROR");
      }
    };

    // Frame processing loop with dynamic throttling
    const loop = () => {
      if (!isRunningRef.current) return;

      const now = Date.now();
      const elapsed = now - lastProcessTime;

      if (elapsed >= targetInterval && videoRef.current && videoRef.current.readyState >= 2) {
        lastProcessTime = now;
        const startDetect = performance.now();

        // 1. Detect faces
        const faces = faceDetectorRef.current.detectFaces(videoRef.current, now);

        // 2. Feed into fault-tolerant State Machine
        const smResult = stateMachineRef.current.processFrame(faces, now);
        setProctoringState(smResult.state);
        setFacePositionStatus(smResult.facePositionStatus);
        setSmoothedBox(smResult.smoothedBox);
        setFaceCount(faces.length);
        setFaceDetected(faces.length > 0);
        setFaceConfidence(faces[0] ? faces[0].confidence : 0.0);

        // 3. Landmark & Gaze Estimation
        const landmarks = landmarkerRef.current.detectLandmarks(videoRef.current, now);
        const gazeResult = gazeServiceRef.current.estimateGaze(landmarks, smResult.smoothedBox || undefined);
        setGazeState(gazeResult.direction);

        if (gazeResult.shouldTriggerEvent) {
          eventManagerRef.current.emitEvent("GAZE_AWAY", gazeResult.gazeAwayDurationMs, gazeResult.confidence);
          addWarning("Repeated off-screen gaze detected.");
        }

        // 4. Quality analysis every 2 seconds
        if (now % 2000 < targetInterval) {
          const q = qualityServiceRef.current.analyzeFrame(videoRef.current);
          setCameraQuality(q);
          if (q.feedbackMessage) {
            addWarning(q.feedbackMessage);
          }
        }

        const detectDuration = performance.now() - startDetect;
        setDetectionLatencyMs(Math.round(detectDuration));

        // Adaptive frame rate: back off if device is struggling (Section 47)
        if (detectDuration > 65) {
          targetInterval = Math.min(250, targetInterval * 1.15); // slow down to 4-8 FPS
        } else if (detectDuration < 25 && targetInterval > 70) {
          targetInterval = Math.max(66, targetInterval * 0.95);  // speed back up to 12-15 FPS
        }

        // FPS calculation
        frameCounter++;
        if (now - lastFpsTime >= 1000) {
          setFps(frameCounter);
          frameCounter = 0;
          lastFpsTime = now;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    setupVision();

    // Clean unmount (Section 69: "Camera stream is stopped when exam ends, MediaPipe resources are cleaned up, WebSocket is closed, Event listeners are removed")
    return () => {
      isRunningRef.current = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      cameraServiceRef.current.stop();
      browserMonitorRef.current.stop();
      wsClientRef.current.close();
      faceDetectorRef.current.close();
      landmarkerRef.current.close();
    };
  }, [sessionId, configuration, addWarning]);

  return {
    videoRef,
    cameraStatus,
    proctoringState,
    faceCount,
    faceDetected,
    faceConfidence,
    gazeState,
    facePositionStatus,
    smoothedBox,
    cameraQuality,
    activeWarnings,
    events,
    fps,
    detectionLatencyMs,
    webSocketConnected,
    isStreaming,
    clearWarning
  };
}
