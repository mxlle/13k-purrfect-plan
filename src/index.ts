import "./globals.scss";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { initPoki, pokiSdk } from "./poki-integration";
import { CssClass } from "./utils/css-class";
import { sleep } from "./utils/promise-utils";
import { initAudio } from "./audio/music-control";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import { GAME_TITLE, HAS_SIMPLE_SOUND_EFFECTS, HAS_VISUAL_NICE_TO_HAVES, IS_POKI_ENABLED } from "./env-utils";
import { initWinLoseSoundEffects, loseSoundSrcUrl, winSoundSrcUrl } from "./audio/sound-control/sound-control-box";
import { playSound } from "./audio/sound-control/sound-control";
import { StarBackground } from "./components/background/star-background";
import { HeaderComponent } from "./framework/components/header/header.component";
import { LoadGameButton } from "./components/global-elements/load-game-button/load-game-button";
import { MuteButton } from "./components/global-elements/mute-button/mute-button";
import { TotalXpInfoComponent } from "./components/global-elements/xp-components/total-xp-info.component";
import { GameAreaComponent } from "./components/game-area/game-area.component";
import { globals } from "./globals";
import { updateAvailableLevels } from "./components/level-selection/level-selection";
import { LoadLevelButton } from "./components/global-elements/load-level-button/load-level-button";

if (HAS_VISUAL_NICE_TO_HAVES) {
  import("./globals.nice2have.scss");
}

const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

let isInitialized = false;

async function init() {
  if (isInitialized) return;
  isInitialized = true;

  const [gameArea, startNewGame] = await GameAreaComponent();

  document.body.append(
    StarBackground(),
    HeaderComponent(GAME_TITLE, [LoadLevelButton(), LoadGameButton(startNewGame), MuteButton(), TotalXpInfoComponent()]),
    gameArea,
  );

  if (globals.gameState) {
    void startNewGame({ isFirstGame: true, gameSetup: globals.gameState.setup });
  }

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, (options) => {
    void startNewGame(options);
  });

  pubSubService.subscribe(PubSubEvent.GAME_END, (result) => {
    if (result.isWon) {
      document.body.classList.add(CssClass.WON);
      updateAvailableLevels(decodeURI(location.hash.replace("#", "")));
    }

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
  await init();
  await sleep(0); // to make it a real promise
  await initAudio(initializeMuted);
  HAS_SIMPLE_SOUND_EFFECTS && (await initWinLoseSoundEffects());
};

if (IS_POKI_ENABLED) initPoki(initApp);
else initApp();
