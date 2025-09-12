import "./globals.scss";
import styles from "./index.module.scss";
import { createButton, createElement } from "./utils/html-utils";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { initializeEmptyGameField, startNewGame } from "./components/game-field/game-field";
import { initPoki, pokiSdk } from "./poki-integration";
import { isOnboarding } from "./logic/onboarding";
import { DEFAULT_FIELD_SIZE } from "./logic/data/field-size";
import { CssClass } from "./utils/css-class";
import { sleep } from "./utils/promise-utils";
import { changeXP, getCurrentXP, getXpText } from "./logic/data/experience-points";
import { animateNumber } from "./utils/custom-animation-util";
import { initAudio, togglePlayer } from "./audio/music-control";
import { getLocalStorageItem, LocalStorageKey } from "./utils/local-storage";
import {
  GAME_TITLE,
  HAS_MUTE_BUTTON,
  HAS_SIMPLE_SOUND_EFFECTS,
  HAS_SOUND_EFFECTS,
  HAS_VISUAL_NICE_TO_HAVES,
  IS_POKI_ENABLED,
} from "./env-utils";
import { initSoundEffects, initWinLoseSoundEffects, loseSoundSrcUrl, winSoundSrcUrl } from "./audio/sound-control/sound-control-box";
import { playSoundSimple } from "./audio/sound-control/sound-control";

if (HAS_VISUAL_NICE_TO_HAVES) {
  import("./globals.nice2have.scss");
}

let titleElement: HTMLElement;
let xpElement: HTMLElement;

const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

let isInitialized = false;

function init() {
  if (isInitialized) return;
  isInitialized = true;

  const header = createElement({
    cssClass: styles.header,
  });

  titleElement = createElement({
    cssClass: styles.title,
    text: GAME_TITLE,
  });

  header.append(titleElement);

  const btnContainer = createElement({
    cssClass: styles.headerButtons,
  });

  if (HAS_MUTE_BUTTON) {
    const muteButton = createButton({
      text: initializeMuted ? "🔇" : "🔊",
      onClick: (event: MouseEvent) => {
        const isActive = togglePlayer();
        (event.target as HTMLElement).textContent = isActive ? "🔊" : "🔇";
      },
      cssClass: [CssClass.ICON_BTN, CssClass.SECONDARY],
    });

    btnContainer.append(muteButton);
  }

  xpElement = createElement();
  updateXpElement();
  btnContainer.append(xpElement);

  header.append(btnContainer);

  document.body.append(header);

  if (isOnboarding() || location.hash.length > 1) {
    void startNewGame({ isDoOver: false });
  } else {
    void initializeEmptyGameField(DEFAULT_FIELD_SIZE);
  }

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, (options) => {
    void startNewGame(options);
  });

  pubSubService.subscribe(PubSubEvent.GAME_END, (result) => {
    document.body.classList.add(result.isWon ? CssClass.WON : CssClass.LOST);

    if (HAS_SIMPLE_SOUND_EFFECTS) {
      const soundEffect = result.isWon ? winSoundSrcUrl : loseSoundSrcUrl;
      soundEffect && playSoundSimple(soundEffect);
    }

    if (IS_POKI_ENABLED) {
      sleep(300).then(() => pokiSdk.gameplayStop()); // to avoid issue that stop is called before start
    }
  });

  pubSubService.subscribe(PubSubEvent.UPDATE_XP, (newXP) => {
    updateXpWithAnimation(newXP);
  });
}

function updateXpWithAnimation(newXP: number) {
  const oldXP = getCurrentXP();
  const targetXP = changeXP(newXP);

  if (HAS_VISUAL_NICE_TO_HAVES) {
    animateNumber({
      keyframeDuration: Math.abs(newXP) * 80,
      initialState: oldXP,
      exitState: targetXP,
      onProgress: (current) => {
        updateXpElement(Math.round(current));
      },
    });
  } else {
    updateXpElement(targetXP);
  }
}

function updateXpElement(xp: number = getCurrentXP()) {
  xpElement.innerText = getXpText(xp);
}

// INIT
const initApp = async () => {
  init();
  await sleep(0); // to make it a real promise
  await initAudio(initializeMuted);
  HAS_SOUND_EFFECTS && (await initSoundEffects());
  HAS_SIMPLE_SOUND_EFFECTS && (await initWinLoseSoundEffects());
};

if (IS_POKI_ENABLED) initPoki(initApp);
else initApp();
