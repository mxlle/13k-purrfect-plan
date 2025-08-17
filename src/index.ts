import "./index.scss";

import { createElement } from "./utils/html-utils";
import { PubSubEvent, pubSubService } from "./utils/pub-sub-service";
import { initializeEmptyGameField, startNewGame } from "./components/game-field/game-field";
import { initPoki } from "./poki-integration";
import { isOnboarding } from "./logic/onboarding";
import { isGameInProgress } from "./globals";

let titleElement: HTMLElement;
let currentScore = 0;

// const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

function init() {
  const header = createElement({
    tag: "header",
  });

  titleElement = createElement({
    cssClass: "title",
    text: "Kittens united - a purrfect plan",
  });

  header.append(titleElement);

  // const btnContainer = createElement({
  //   cssClass: "h-btns",
  // });
  // const muteButton = createButton({
  //   text: initializeMuted ? "🔇" : "🔊",
  //   onClick: (event: MouseEvent) => {
  //     const isActive = togglePlayer();
  //     (event.target as HTMLElement).textContent = isActive ? "🔊" : "🔇";
  //   },
  //   iconBtn: true,
  // });
  //
  // btnContainer.append(muteButton);
  //
  // header.append(btnContainer);
  //
  // btnContainer.append(createButton({ text: "⚙️", onClick: () => createWinScreen(currentScore, false), iconBtn: true }));

  document.body.append(header);

  if (isOnboarding()) {
    void startNewGame();
  } else {
    void initializeEmptyGameField();
  }

  document.addEventListener("keydown", (event) => {
    console.debug("Key pressed:", event);

    if (event.code === "Space") {
      console.debug("Space key pressed");

      if (!isGameInProgress()) {
        void startNewGame();
      }
    }
  });

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, () => {
    void startNewGame();
  });
}

// INIT
const initApp = async () => {
  init();
  // await initAudio(initializeMuted);
};

if (process.env.POKI_ENABLED === "true") initPoki(initApp);
else initApp();
