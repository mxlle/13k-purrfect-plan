import { TurnMove } from "../../types";

const soundMap: Partial<Record<TurnMove, string>> = {};

export function hasSoundForAction(action: TurnMove): boolean {
  return Boolean(soundMap[action]);
}

export async function playSoundForAction(action: TurnMove) {
  const soundSrc = soundMap[action];
  if (!soundSrc) return;

  const audio = new Audio(soundSrc);
  // On mobile, playback must be user-gesture initiated. Ensure callers trigger this in a click/tap handler.
  audio.preload = "auto";
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });
}

export function saveRecording(action: TurnMove, audioSrc: string) {
  soundMap[action] = audioSrc;
}

export type ActiveRecording = {
  stop: () => void;
  done: Promise<string>; // base64 data URL
};

export async function startRecording(): Promise<ActiveRecording> {
  // Basic feature checks
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not supported on this device/browser.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Recording is not supported on this device/browser.");
  }

  // Pick a MIME type that this browser can actually produce
  const mimeType = pickSupportedMimeType();

  // Mobile-friendly constraints for cleaner audio
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  // Pass the chosen MIME type if available
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.addEventListener("dataavailable", (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  });

  const done = new Promise<string>((resolve, reject) => {
    recorder.addEventListener("stop", async () => {
      try {
        // Ensure the blob has a sane, playable type for the current browser
        const type = mimeType || recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });
        const base64 = await blobToDataUrl(blob);
        resolve(base64);
      } catch (e) {
        reject(e);
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    });
    recorder.addEventListener("error", (e: Event) => {
      reject((e as any)?.error ?? e);
    });
  });

  // iOS Safari may not emit dataavailable without a timeslice; also call requestData() before stop()
  recorder.start(250); // request chunks ~4x/s to ensure we get at least one
  const stop = () => {
    if (recorder.state === "recording") {
      try {
        recorder.requestData(); // flush last chunk for Safari
      } catch {
        // ignore
      }
      recorder.stop();
    }
  };

  // Also stop when the track ends
  stream.getAudioTracks().forEach((t) => t.addEventListener("ended", stop));

  return { stop, done };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

// Try common audio-only types in an order that tends to work across mobile browsers.
// - Chrome/Android: audio/webm;codecs=opus
// - iOS Safari: audio/mp4;codecs=mp4a.40.2
// - Firefox (Android): audio/ogg;codecs=opus
function pickSupportedMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  if (typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}
