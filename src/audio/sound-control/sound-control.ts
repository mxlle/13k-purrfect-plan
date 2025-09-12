import { TurnMove } from "../../types";
import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { getSoundBoxSrc } from "./sound-control-box";

const soundMap: Partial<Record<TurnMove, string>> = {};

const synth = window.speechSynthesis;

export function hasSoundForAction(action: TurnMove): boolean {
  return Boolean(getSoundForAction(action));
}

export async function playSoundForAction(action: TurnMove, playbackRate: number = 1) {
  const soundSrc = getSoundForAction(action);
  if (!soundSrc) return;

  await playSound(soundSrc, playbackRate);
}

export function speak(text: string, rate: number = 1, pitch: number = 1): Promise<void> {
  if (!synth) return Promise.resolve();

  const utterThis = new SpeechSynthesisUtterance();
  utterThis.text = text;
  utterThis.rate = rate;
  utterThis.pitch = pitch;
  utterThis.voice = getPreferredVoice();

  return new Promise((resolve) => {
    utterThis.onend = () => {
      resolve();
    };
    synth.speak(utterThis);
  });
}

let preferredVoice: SpeechSynthesisVoice | undefined;
function getPreferredVoice() {
  if (!preferredVoice) {
    const voices = synth.getVoices();
    const englishVoices = voices.filter((voice) => voice.lang.startsWith("en"));
    console.debug("English voices:", englishVoices.map((voice) => voice.name).join("\n") || "none");
    const grandma = englishVoices.find((voice) => voice.name.toLowerCase().includes("grandma"));

    if (grandma) {
      preferredVoice = grandma;
    } else {
      const englishFemale = englishVoices.find((voice) => voice.name.toLowerCase().includes("female"));
      if (englishFemale) {
        preferredVoice = englishFemale;
      } else {
        preferredVoice = englishVoices[0] || voices[0] || undefined;
      }
    }
  }

  return preferredVoice;
}

export function playSound(audioSrc: string, playbackRate: number = 1) {
  const audio = new Audio(audioSrc);
  audio.preload = "auto";
  audio.preservesPitch = false;
  audio.playbackRate = playbackRate;
  audio.play().catch((error) => {
    console.error("Error playing sound:", error);
  });

  return new Promise<void>((resolve) => {
    audio.addEventListener("ended", () => resolve());
    audio.addEventListener("error", () => resolve());
  });
}

export function playSoundSimple(audioSrc: string) {
  const audio = new Audio(audioSrc);
  void audio.play();
}

function getSoundForAction(action: TurnMove): string | undefined {
  if (!soundMap[action]) {
    soundMap[action] = getLocalStorageItem(LocalStorageKey.SOUND, action);
  }

  return soundMap[action] ?? getSoundBoxSrc(action);
}

export function saveRecording(action: TurnMove, audioSrc: string) {
  soundMap[action] = audioSrc;

  setLocalStorageItem(LocalStorageKey.SOUND, audioSrc, action);
}

export type ActiveRecording = {
  stop: () => void;
  done: Promise<string>; // base64 data URL
};

export async function requestMicrophoneAccess(): Promise<boolean> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    console.warn("Microphone access requires a secure context (HTTPS/localhost) and getUserMedia support.");
    return false;
  }

  // If the Permissions API is available, check current state.
  const perm = await navigator.permissions?.query({ "name": "microphone" as PermissionName }).catch(() => null);

  if (perm?.state === "granted") return true;
  if (perm?.state === "denied") return false;

  // State is "prompt" or unknown → trigger the prompt with a minimal request.
  try {
    const s = await navigator.mediaDevices.getUserMedia({ "audio": true });
    s.getTracks().forEach((t) => t.stop());
    return true;
  } catch (e: any) {
    console.warn("Microphone access rejected:", e?.name, e?.message);
    return false;
  }
}

export async function startRecording(): Promise<ActiveRecording> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not supported on this device/browser.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Recording is not supported on this device/browser.");
  }

  const mimeType = pickSupportedMimeType();

  // 1) Always request minimal constraints first
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ "audio": true });
  } catch (err: any) {
    // Some Android variants throw this message even for audio: true — surface a clearer hint
    const name = err?.name ?? "Error";
    const msg = err?.message ?? String(err);
    console.error("getUserMedia failed:", name, msg);
    if (/at least one of audio and video must be requested/i.test(msg)) {
      throw new Error(
        "The browser rejected the microphone request. Ensure you're on HTTPS, not in a restricted iframe, and that mic permission is allowed.",
      );
    }
    throw err;
  }

  // 2) Optionally improve audio after acquiring the track
  try {
    const [track] = stream.getAudioTracks();
    if (track?.applyConstraints) {
      // Use capabilities to decide what to apply (avoids OverconstrainedError on some devices)
      const caps = (track as any).getCapabilities?.() ?? {};
      const postConstraints: MediaTrackConstraints = {};
      if ("echoCancellation" in caps) postConstraints.echoCancellation = true;
      if ("noiseSuppression" in caps) postConstraints.noiseSuppression = true;

      if (Object.keys(postConstraints).length) {
        await track.applyConstraints(postConstraints).catch(() => {
          // Non-fatal if some constraints can't be applied
        });
      }
    }
  } catch {
    // Ignore post-constraint errors
  }

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.addEventListener("dataavailable", (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  });

  const done = new Promise<string>((resolve, reject) => {
    recorder.addEventListener("stop", async () => {
      try {
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

  // Use a timeslice and flush to make mobile browsers reliably emit dataavailable
  recorder.start(250);
  const stop = () => {
    if (recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        // ignore
      }
      recorder.stop();
    }
  };

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

function pickSupportedMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/aac",
  ];
  if (typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}
