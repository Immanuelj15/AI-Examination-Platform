/**
 * Browser Monitoring Service
 * Tracks client behavioral events (tab switch, blur, focus, fullscreen) with event debouncing.
 */

import { ProctorEventType } from "./types";

export interface BrowserEventCallback {
  (type: ProctorEventType, metadata?: Record<string, unknown>): void;
}

export class BrowserMonitoringService {
  private callback: BrowserEventCallback | null = null;
  private lastTriggerTimes: Record<string, number> = {};
  private readonly cooldownMs: Record<string, number> = {
    TAB_SWITCH: 3000,
    WINDOW_BLUR: 3000,
    WINDOW_FOCUS: 2000,
    FULLSCREEN_EXIT: 3000
  };

  private boundVisibilityHandler = this.handleVisibilityChange.bind(this);
  private boundBlurHandler = this.handleWindowBlur.bind(this);
  private boundFocusHandler = this.handleWindowFocus.bind(this);
  private boundFullscreenHandler = this.handleFullscreenChange.bind(this);

  public start(onEvent: BrowserEventCallback): void {
    this.callback = onEvent;

    document.addEventListener("visibilitychange", this.boundVisibilityHandler);
    window.addEventListener("blur", this.boundBlurHandler);
    window.addEventListener("focus", this.boundFocusHandler);
    document.addEventListener("fullscreenchange", this.boundFullscreenHandler);
  }

  private dispatchWithDebounce(type: ProctorEventType, metadata?: Record<string, unknown>): void {
    const now = Date.now();
    const last = this.lastTriggerTimes[type] || 0;
    const cooldown = this.cooldownMs[type] || 2000;

    if (now - last >= cooldown) {
      this.lastTriggerTimes[type] = now;
      this.callback?.(type, metadata);
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.dispatchWithDebounce("TAB_SWITCH", {
        reason: "Document visibilityState changed to hidden"
      });
    }
  }

  private handleWindowBlur(): void {
    this.dispatchWithDebounce("WINDOW_BLUR", {
      reason: "Exam window lost focus"
    });
  }

  private handleWindowFocus(): void {
    this.dispatchWithDebounce("WINDOW_FOCUS", {
      reason: "Exam window regained focus"
    });
  }

  private handleFullscreenChange(): void {
    if (!document.fullscreenElement) {
      this.dispatchWithDebounce("FULLSCREEN_EXIT", {
        reason: "Document exited active fullscreen lock"
      });
    }
  }

  public isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  public isDocumentFocused(): boolean {
    return !document.hidden && document.hasFocus();
  }

  public stop(): void {
    document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    window.removeEventListener("blur", this.boundBlurHandler);
    window.removeEventListener("focus", this.boundFocusHandler);
    document.removeEventListener("fullscreenchange", this.boundFullscreenHandler);
    this.callback = null;
  }
}
