import "./globals.scss";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { initializeEmptyGameField, startNewGame } from "./components/game-field/game-field";
import { initPoki, pokiSdk } from "./poki-integration";
import { isOnboarding } from "./logic/onboarding";
import { DEFAULT_FIELD_SIZE } from "./logic/data/field-size";
import { CssClass } from "./utils/css-class";
import { sleep } from "./utils/promise-utils";
import { initAudio } from "./audio/music-control";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { GAME_TITLE, HAS_SIMPLE_SOUND_EFFECTS, HAS_VISUAL_NICE_TO_HAVES, IS_POKI_ENABLED } from "./env-utils";
import { initWinLoseSoundEffects, loseSoundSrcUrl, winSoundSrcUrl } from "./audio/sound-control/sound-control-box";
import { playSound } from "./audio/sound-control/sound-control";
import { StarBackground } from "./components/background/star-background";
import { HeaderComponent } from "./framework/components/header/header.component";
import { LoadGameButton } from "./components/load-game-button/load-game-button";
import { MuteButton } from "./components/mute-button/mute-button";
import { TotalXpInfoComponent } from "./components/xp-components/total-xp-info.component";

if (HAS_VISUAL_NICE_TO_HAVES) {
  import("./globals.nice2have.scss");
}

const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

let isInitialized = false;

function init() {
  if (isInitialized) return;
  isInitialized = true;

  document.body.append(StarBackground(), HeaderComponent(GAME_TITLE, [LoadGameButton(), MuteButton(), TotalXpInfoComponent()]));

  if (isOnboarding() || location.hash.length > 1) {
    void startNewGame({ isDoOver: false });
  } else {
    void initializeEmptyGameField(DEFAULT_FIELD_SIZE);
  }

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, (options) => {
    void startNewGame(options);
  });

  pubSubService.subscribe(PubSubEvent.GAME_END, (result) => {
    result.isWon && document.body.classList.add(CssClass.WON);

    if (HAS_SIMPLE_SOUND_EFFECTS) {
      const soundEffect = result.isWon ? winSoundSrcUrl : loseSoundSrcUrl;
      soundEffect && playSound(soundEffect);
    }

    if (IS_POKI_ENABLED) {
      sleep(300).then(() => pokiSdk.gameplayStop()); // to avoid issue that stop is called before start
    }
  });
}

// INIT
const initApp = async () => {
  init();
  await sleep(0); // to make it a real promise
  await initAudio(initializeMuted);
  HAS_SIMPLE_SOUND_EFFECTS && (await initWinLoseSoundEffects());
};

if (IS_POKI_ENABLED) initPoki(initApp);
else initApp();
