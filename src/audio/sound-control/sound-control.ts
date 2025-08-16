import { TurnMove } from "../../types";

const soundMap: Partial<Record<TurnMove, string>> = {};

export function hasSoundForAction(action: TurnMove): boolean {
  return Boolean(soundMap[action]);
}

export async function playSoundForAction(action: TurnMove) {
  const soundSrc = soundMap[action];

  if (!soundSrc) {
    return;
  }

  const audio = new Audio(soundSrc);
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
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const done = new Promise<string>((resolve, reject) => {
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        const base64 = await blobToDataUrl(blob);
        resolve(base64);
      } catch (e) {
        reject(e);
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start(); // user gesture required
  const stop = () => recorder.state !== "inactive" && recorder.stop();

  // also stop when the track ends
  stream.getAudioTracks().forEach((t) => (t.onended = stop));

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
