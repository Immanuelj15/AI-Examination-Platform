/**
 * AudioAnalysisService
 * Real-time acoustic intelligence for examination proctoring:
 * - Decibel / RMS energy analysis for ambient noise detection
 * - Edge Web Speech API for whisper & multi-voice speech transcription
 */

export interface AudioMetrics {
  rmsLevel: number;
  isSpeechDetected: boolean;
  isWhisperDetected: boolean;
  transcriptSnippet: string;
}

export class AudioAnalysisService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private recognition: any = null;
  private isListening = false;
  private onAnomalyCallback?: (type: string, message: string) => void;
  private checkInterval: NodeJS.Timeout | null = null;

  private speechStreak = 0;
  private whisperStreak = 0;

  constructor() {}

  public async start(
    onAnomaly: (type: string, message: string) => void
  ): Promise<boolean> {
    this.onAnomalyCallback = onAnomaly;
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      // Request microphone access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Keep raw dynamics to catch whispers
          autoGainControl: true
        }
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        const source = this.audioCtx.createMediaStreamSource(this.micStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        source.connect(this.analyser);

        // Periodically monitor acoustic RMS energy
        this.startRMSMonitoring();
      }

      // Initialize Web Speech Recognition if available
      this.initSpeechRecognition();

      this.isListening = true;
      return true;
    } catch (err) {
      console.warn("[AudioAnalysisService] Microphone initialization failed:", err);
      return false;
    }
  }

  private startRMSMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.checkInterval = setInterval(() => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      // Calculate Root Mean Square energy
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Acoustic thresholds
      // Normal silent room: RMS 5 - 20
      // Sustained whisper: RMS 25 - 45 in high-frequency band
      // Loud voice / dictation: RMS > 65
      if (rms > 70) {
        this.speechStreak++;
        if (this.speechStreak >= 3) {
          this.onAnomalyCallback?.(
            "ELEVATED_AMBIENT_NOISE",
            "High acoustic noise detected. Please ensure your testing environment is quiet."
          );
          this.speechStreak = 0;
        }
      } else if (rms > 32 && rms <= 65) {
        this.whisperStreak++;
        if (this.whisperStreak >= 4) {
          this.onAnomalyCallback?.(
            "ACOUSTIC_WHISPER_DETECTED",
            "Continuous whispering or secondary voice detected near microphone."
          );
          this.whisperStreak = 0;
        }
      } else {
        this.speechStreak = Math.max(0, this.speechStreak - 1);
        this.whisperStreak = Math.max(0, this.whisperStreak - 1);
      }
    }, 1500);
  }

  private initSpeechRecognition(): void {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.info("[AudioAnalysisService] Edge speech recognition not supported by browser.");
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event: any) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim();
        if (transcript.length > 2) {
          this.onAnomalyCallback?.(
            "HUMAN_SPEECH_DETECTED",
            `Spoken acoustic activity detected: "${transcript.slice(0, 35)}..."`
          );
        }
      };

      this.recognition.onerror = (err: any) => {
        // Silently handle common speech errors (no-speech, aborted)
        if (err.error !== "no-speech" && err.error !== "aborted") {
          console.warn("[AudioAnalysisService] Speech recognition warning:", err.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch {}
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn("[AudioAnalysisService] Speech recognition startup error:", err);
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

