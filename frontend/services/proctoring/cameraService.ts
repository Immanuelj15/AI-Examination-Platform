/**
 * Camera Service
 * Handles resilient webcam lifecycle, track listeners, and automatic recovery.
 */

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onDisconnectCallback?: () => void;
  private onRestoredCallback?: () => void;
  private isReconnecting = false;

  public async initializeCamera(
    videoEl: HTMLVideoElement,
    onDisconnect?: () => void,
    onRestored?: () => void
  ): Promise<MediaStream> {
    this.videoElement = videoEl;
    this.onDisconnectCallback = onDisconnect;
    this.onRestoredCallback = onRestored;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("MediaDevices API not supported on this browser.");
    }

    try {
      // First attempt with ideal 720p
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: "user"
        },
        audio: false
      });
    } catch {
      // Fallback for basic webcams
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
    }

    this.attachStreamToVideo(this.stream);
    this.bindTrackEvents(this.stream);

    return this.stream;
  }

  private attachStreamToVideo(stream: MediaStream): void {
    if (this.videoElement) {
      this.videoElement.srcObject = stream;
      this.videoElement.play().catch(err => {
        console.warn("[CameraService] Autoplay play error:", err);
      });
    }
  }

  private bindTrackEvents(stream: MediaStream): void {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.warn("[CameraService] Video track ended unexpectedly");
        this.onDisconnectCallback?.();
        this.attemptAutoRecovery();
      };
    }
  }

  private async attemptAutoRecovery(): Promise<void> {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    console.log("[CameraService] Attempting automatic camera reconnection...");
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.stream = stream;
        this.attachStreamToVideo(stream);
        this.bindTrackEvents(stream);
        this.isReconnecting = false;
        console.log("[CameraService] Camera connection restored");
        this.onRestoredCallback?.();
        return;
      } catch {
        // Continue retry loop
      }
    }
    this.isReconnecting = false;
  }

  public getResolution(): { width: number; height: number } {
    if (this.videoElement && this.videoElement.videoWidth) {
      return {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight
      };
    }
    return { width: 640, height: 480 };
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}
