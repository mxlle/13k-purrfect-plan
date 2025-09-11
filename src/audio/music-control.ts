import { CPlayer } from "./small-player";
import { song } from "./songs/soft-kitty";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";

let audioElem: HTMLAudioElement;
let isActive = false;
let initialized = false;

export async function initAudio(initializeMuted: boolean) {
  audioElem = document.createElement("audio");
  audioElem.loop = true;
  audioElem.volume = 0.4;
  audioElem.playbackRate = 1;

  const player = new CPlayer();
  player.init(song);

  await generateUntilDone(player);
  const wave = player.createWave();
  audioElem.src = URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));

  document.addEventListener("visibilitychange", () => {
    audioElem.muted = document.hidden;
  });

  if (import.meta.env.POKI_ENABLED === "true") {
    pubSubService.subscribe(PubSubEvent.MUTE_MUSIC, () => {
      console.log("Muting music");
      audioElem.muted = true;
    });

    pubSubService.subscribe(PubSubEvent.UNMUTE_MUSIC, () => {
      console.log("Unmuting music");
      audioElem.muted = false;
    });
  }

  document.addEventListener("click", () => {
    if (!initialized) {
      initialized = true;

      !initializeMuted && togglePlayer();
    }
  });
}

function generateUntilDone(player): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (player.generate() >= 1) {
        clearInterval(interval);
        resolve();
      }
    }, 0);
  });
}

export function togglePlayer(): boolean {
  isActive = !isActive;
  const isCurrentlyPlaying = !audioElem.paused && !audioElem.ended;
  if (isActive && !isCurrentlyPlaying) {
    audioElem.play();
  } else if (!isActive && isCurrentlyPlaying) {
    audioElem.pause();
  }

  setLocalStorageItem(LocalStorageKey.MUTED, isActive ? "false" : "true");

  return isActive;
}
