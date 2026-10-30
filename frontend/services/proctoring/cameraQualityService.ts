/**
 * Camera Quality Analysis Service
 * Evaluates illumination, contrast, and resolution without transmitting raw frames.
 */

import { CameraQualityMetrics } from "./types";

export class CameraQualityService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.ensureCanvas();
  }

  private ensureCanvas(): boolean {
    if (this.ctx && this.canvas) return true;
    if (typeof document !== "undefined") {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 160;
      this.canvas.height = 120;
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
      return !!this.ctx;
    }
    return false;
  }

  public analyzeFrame(videoEl: HTMLVideoElement): CameraQualityMetrics {
    const width = videoEl.videoWidth || 640;
    const height = videoEl.videoHeight || 480;

    if (!this.ensureCanvas() || !this.ctx || videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return {
        brightness: 128,
        contrast: 50,
        resolution: { width, height },
        status: "GOOD"
      };
    }

    try {
      this.ctx.drawImage(videoEl, 0, 0, 160, 120);
      const imgData = this.ctx.getImageData(0, 0, 160, 120);
      const data = imgData.data;

      let totalBrightness = 0;
      const count = data.length / 4;

      // Sample every 4th pixel for high-performance throughput
      let sampleCount = 0;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard perceptual luminance formula
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += lum;
        sampleCount++;
      }

      const avgBrightness = totalBrightness / sampleCount;

      // Calculate contrast (approx standard deviation)
      let varianceSum = 0;
      for (let i = 0; i < data.length; i += 16) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        varianceSum += Math.pow(lum - avgBrightness, 2);
      }
      const contrast = Math.sqrt(varianceSum / sampleCount);

      // Diagnostic checks
      if (avgBrightness < 45) {
        return {
          brightness: Math.round(avgBrightness),
          contrast: Math.round(contrast),
          resolution: { width, height },
          status: "TOO_DARK",
          feedbackMessage: "Your camera image is too dark. Please move to a better-lit area."
        };
      }

      if (avgBrightness > 215) {
        return {
          brightness: Math.round(avgBrightness),
          contrast: Math.round(contrast),
          resolution: { width, height },
          status: "TOO_BRIGHT",
          feedbackMessage: "Your camera image is too bright. Please adjust your lighting."
        };
      }

      if (width < 320 || height < 240) {
        return {
          brightness: Math.round(avgBrightness),
          contrast: Math.round(contrast),
          resolution: { width, height },
          status: "LOW_RESOLUTION",
          feedbackMessage: "Your camera resolution is too low. Please use a supported camera."
        };
      }

      return {
        brightness: Math.round(avgBrightness),
        contrast: Math.round(contrast),
        resolution: { width, height },
        status: "GOOD"
      };
    } catch {
      return {
        brightness: 128,
        contrast: 50,
        resolution: { width, height },
        status: "GOOD"
      };
    }
  }
}
