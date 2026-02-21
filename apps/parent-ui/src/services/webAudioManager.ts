const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Recording ──────────────────────────────────────────────────────────────

export class WebRecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(250); // collect chunks every 250ms
  }

  async stop(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Not recording"));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
        this.stream?.getTracks().forEach((t) => t.stop());
        this.stream = null;

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Strip data URL prefix: "data:audio/webm;base64,..."
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}

// ─── Playback ────────────────────────────────────────────────────────────────

export class WebAudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private objectUrls: string[] = [];
  private amplitudeTimer: ReturnType<typeof setInterval> | null = null;

  private chunks: Blob[] = [];
  private mimeType = "audio/mpeg";

  onAmplitude?: (value: number) => void;
  onPlaybackEnd?: () => void;

  beginReceiving(format: string) {
    this.chunks = [];
    this.mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
  }

  receiveChunk(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    this.chunks.push(new Blob([bytes], { type: this.mimeType }));
  }

  async play(): Promise<void> {
    const blob = new Blob(this.chunks, { type: this.mimeType });
    const url = URL.createObjectURL(blob);
    this.objectUrls.push(url);

    const audio = new Audio(url);
    this.currentAudio = audio;

    // Connect to Web Audio API for amplitude analysis
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const source = this.audioContext.createMediaElementSource(audio);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this._startAmplitudePolling();

    return new Promise((resolve) => {
      audio.onended = () => {
        this._stopAmplitudePolling();
        this.onPlaybackEnd?.();
        resolve();
      };
      audio.onerror = () => {
        this._stopAmplitudePolling();
        resolve();
      };
      audio.play().catch(() => resolve());
    });
  }

  stop() {
    this.currentAudio?.pause();
    this.currentAudio = null;
    this._stopAmplitudePolling();
    this.objectUrls.forEach((u) => URL.revokeObjectURL(u));
    this.objectUrls = [];
    this.audioContext?.close();
    this.audioContext = null;
  }

  private _startAmplitudePolling() {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.amplitudeTimer = setInterval(() => {
      this.analyser!.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      this.onAmplitude?.(Math.min(1, avg / 128));
    }, 100);
  }

  private _stopAmplitudePolling() {
    if (this.amplitudeTimer) {
      clearInterval(this.amplitudeTimer);
      this.amplitudeTimer = null;
    }
    this.onAmplitude?.(0);
  }
}
