import { CPlayer } from "./small-player";
import { songWithDrums } from "./songs/chords-song-major-v3-with-drums";
import { LocalStorageKey, setLocalStorageItem } from "../utils/local-storage";
import { PubSubEvent, pubSubService } from "../utils/pub-sub-service";

let audioElem: HTMLAudioElement;
let isActive = false;
let initialized = false;

export async function initAudio(initializeMuted: boolean) {
  isActive = !initializeMuted;

  audioElem = document.createElement("audio");
  audioElem.loop = true;
  audioElem.volume = 0.5;
  audioElem.playbackRate = 1;

  const player = new CPlayer();
  player.init(songWithDrums);

  await generateUntilDone(player);
  const wave = player.createWave();
  audioElem.src = URL.createObjectURL(new Blob([wave], { type: "audio/wav" }));

  document.addEventListener("visibilitychange", () => {
    audioElem.muted = document.hidden;
  });

  pubSubService.subscribe(PubSubEvent.MUTE_MUSIC, () => {
    console.log("Muting music");
    audioElem.muted = true;
  });

  pubSubService.subscribe(PubSubEvent.UNMUTE_MUSIC, () => {
    console.log("Unmuting music");
    audioElem.muted = false;
  });

  document.addEventListener("click", () => {
    if (!initialized) {
      initialized = true;

      const isCurrentlyPlaying = !audioElem.paused && !audioElem.ended;
      if (isActive && !isCurrentlyPlaying) {
        audioElem.play();
      }
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
