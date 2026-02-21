import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

// Buffer to convert base64 audio chunks into playable audio
export class AudioManager {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private amplitudeCallback: ((amplitude: number) => void) | null = null;
  private animationFrame: ReturnType<typeof setInterval> | null = null;

  async initialize() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }

  onAmplitude(callback: (amplitude: number) => void) {
    this.amplitudeCallback = callback;
  }

  async playAudioChunks(base64Chunks: string[], format: string = "mp3") {
    // Combine all chunks into one base64 string
    const combined = base64Chunks.join("");
    if (!combined) return;

    try {
      // Write to temp file
      const ext = format === "mp3" ? "mp3" : "wav";
      const uri = `${FileSystem.cacheDirectory}response_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(uri, combined, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      this.isPlaying = true;

      // Simulate amplitude from playback for lip-sync
      this.startAmplitudeSimulation();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
          this.stopAmplitudeSimulation();
          this.amplitudeCallback?.(0);
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error("Audio playback error:", err);
      this.isPlaying = false;
      this.stopAmplitudeSimulation();
    }
  }

  private startAmplitudeSimulation() {
    // Simulate mouth movement with a simple oscillation
    // In production, extract actual amplitude from audio data
    this.animationFrame = setInterval(() => {
      if (this.isPlaying && this.amplitudeCallback) {
        // Random amplitude between 0.3 and 1.0 to simulate speech
        const amplitude = 0.3 + Math.random() * 0.7;
        this.amplitudeCallback(amplitude);
      }
    }, 100); // Update every 100ms for lip-sync
  }

  private stopAmplitudeSimulation() {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
  }

  async stopPlayback() {
    this.isPlaying = false;
    this.stopAmplitudeSimulation();
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.amplitudeCallback?.(0);
  }

  async cleanup() {
    await this.stopPlayback();
  }
}

// Recording manager for microphone input
export class RecordingManager {
  private recording: Audio.Recording | null = null;

  async startRecording(): Promise<void> {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission not granted");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.recording = recording;
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;

    if (!uri) return null;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Cleanup temp file
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {}

    return base64;
  }

  async cancelRecording(): Promise<void> {
    if (!this.recording) return;
    try {
      await this.recording.stopAndUnloadAsync();
    } catch {}
    this.recording = null;
  }
}
