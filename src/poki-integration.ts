import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";

interface PokiSDK {
  init: () => Promise<void>;
  gameLoadingFinished: () => void;
  gameplayStart: () => void;
  gameplayStop: () => void;
  commercialBreak: (callback: () => void) => Promise<void>;
}

declare const PokiSDK: PokiSDK;

export let pokiSdk: PokiSDK | undefined;

const createElement = (tag, props) => Object.assign(document.createElement(tag), props)
const loadScript = (src) => new Promise((onload, onerror) => document.head.appendChild(createElement('script', { src, onload, onerror })))

export async function initPoki(continueToGame: () => Promise<void>) {
  if (process.env.POKI_ENABLED !== 'true') return continueToGame();

  try {
    await loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js');
    pokiSdk = PokiSDK;
  } catch (error) {
    console.log("Failed to load Poki SDK", error);
  }

  pokiSdk
    .init()
    .then(() => {
      console.log("Poki SDK successfully initialized");
      return continueToGame();
    })
    .then(() => {
      pokiSdk.gameLoadingFinished();
    })
    .catch(() => {
      console.log("Initialized, something went wrong, load you game anyway");
      // fire your function to continue to game
      return continueToGame();
    });
}

export function handlePokiCommercial(): Promise<void> {
  if (process.env.POKI_ENABLED !== 'true') return;
  // pause your game here if it isn't already
  return pokiSdk
    .commercialBreak(() => {
      // you can pause any background music or other audio here
      pubSubService.publish(PubSubEvent.MUTE_MUSIC);
    })
    .then(() => {
      console.log("Commercial break finished, proceeding to game");
      // if the audio was paused you can resume it here (keep in mind that the function above to pause it might not always get called)
      // continue your game here
      pubSubService.publish(PubSubEvent.UNMUTE_MUSIC);
    })
    .catch((error: Error) => {
      console.error("Commercial break failed", error);
    });
}
