import "./index.scss";

import { createButton, createElement } from "./utils/html-utils";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { initializeEmptyGameField, startNewGame, toggleConfig } from "./components/game-field/game-field";
import { initPoki, pokiSdk } from "./poki-integration";
import { isOnboarding } from "./logic/onboarding";
import { DEFAULT_FIELD_SIZE } from "./logic/data/field-size";
import { CssClass } from "./utils/css-class";

let titleElement: HTMLElement;

// const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

function init() {
  const header = createElement({
    tag: "header",
  });

  titleElement = createElement({
    cssClass: CssClass.TITLE,
    text: "Kittens united - a purrfect plan",
  });

  header.append(titleElement);

  if (import.meta.env.DEV) {
    const btnContainer = createElement({
      cssClass: "h-btns",
    });

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
    header.append(btnContainer);

    btnContainer.append(createButton({ text: "⚙️", onClick: () => toggleConfig(), cssClass: CssClass.ICON_BTN }));
  }

  document.body.append(header);

  if (isOnboarding() || location.hash.length > 1) {
    void startNewGame({ shouldIncreaseLevel: false });
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
      pokiSdk.gameplayStop();
    }
  });
}

// INIT
const initApp = async () => {
  init();
  // await initAudio(initializeMuted);
};

if (import.meta.env.POKI_ENABLED === "true") initPoki(initApp);
else initApp();
