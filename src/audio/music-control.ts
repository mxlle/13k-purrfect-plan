import { song } from "./songs/music-and-sounds";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";
import { IS_POKI_ENABLED } from "../env-utils";
import { CPlayerSimple } from "./small-player-simple";

let audioElem: HTMLAudioElement;
let isActive = false;
let initialized = false;

export async function initAudio(initializeMuted: boolean) {
  const player = new CPlayerSimple();
  player.init(song);

  await generateUntilDone(player);
  const wave = player.createWave();
  const src = URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));

  audioElem = new Audio(src);
  audioElem.loop = true;
  audioElem.volume = 0.5;

  document.addEventListener("visibilitychange", () => {
    audioElem.muted = document.hidden;
  });

  if (IS_POKI_ENABLED) {
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

export function generateUntilDone(player): Promise<void> {
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
