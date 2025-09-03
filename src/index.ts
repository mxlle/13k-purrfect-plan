import "./index.scss";

import { createButton, createElement } from "./utils/html-utils";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { initializeEmptyGameField, startNewGame, toggleConfig } from "./components/game-field/game-field";
import { initPoki, pokiSdk } from "./poki-integration";
import { isOnboarding } from "./logic/onboarding";
import { DEFAULT_FIELD_SIZE } from "./logic/data/field-size";
import { CssClass } from "./utils/css-class";
import { sleep } from "./utils/promise-utils";
import { changeXP, getCurrentXP, getXPString } from "./logic/data/experience-points";
import { animateNumber } from "./utils/custom-animation-util";

let titleElement: HTMLElement;
let xpElement: HTMLElement;

// const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

let isInitialized = false;

function init() {
  if (isInitialized) return;
  isInitialized = true;

  const header = createElement({
    tag: "header",
  });

  titleElement = createElement({
    cssClass: CssClass.TITLE,
    text: "Kittens united - a purrfect plan",
  });

  header.append(titleElement);

  const btnContainer = createElement({
    cssClass: "h-btns",
  });

  if (import.meta.env.DEV) {
    // const muteButton = createButton({
    //   text: initializeMuted ? "🔇" : "🔊",
    //   onClick: (event: MouseEvent) => {
    //     const isActive = togglePlayer();
    //     (event.target as HTMLElement).textContent = isActive ? "🔊" : "🔇";
    //   },
    //   cssClass: CssClass.ICON_BTN,
    // });
    //
    // btnContainer.append(muteButton);

    btnContainer.append(createButton({ text: "⚙️", onClick: () => toggleConfig(), cssClass: CssClass.ICON_BTN }));
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
    result.isWon && document.body.classList.add(CssClass.WON);
    !result.isWon && document.body.classList.add(CssClass.LOST);

    if (import.meta.env.POKI_ENABLED === "true") {
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

  animateNumber({
    keyframeDuration: 500,
    initialState: oldXP,
    nextState: () => targetXP,
    onProgress: (current) => {
      updateXpElement(Math.round(current));
    },
    exitState: targetXP,
    iterationCount: 1,
  });
}

function updateXpElement(xp: number = getCurrentXP()) {
  xpElement.innerHTML = getXPString(xp);
}

// INIT
const initApp = async () => {
  init();
  await sleep(0); // to make it a real promise
  // await initAudio(initializeMuted);
};

if (import.meta.env.POKI_ENABLED === "true") initPoki(initApp);
else initApp();
