import { isWinConditionMet } from "../../logic/checks";
import { globals } from "../../globals";
import { getParFromGameState } from "../../logic/data/game-elements";
import { createButton, createElement } from "../../utils/html-utils";
import styles from "./controls-and-info-component.module.scss";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { isOnboarding } from "../../logic/onboarding";
import { hasMoveLimit, hasUnknownConfigItems } from "../../logic/config/config";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import {
  getGameInfoComponent,
  hideRetryInfo,
  toggleDoOverButtonVisibility,
  updateGameInfoComponent,
} from "./game-info/game-info-component";
import { calculateNewXP } from "../../logic/data/experience-points";
import { getCollectXpButton } from "../xp-components/xp-components";
import { CssClass } from "../../utils/css-class";
import {
  initHintButton,
  initMovementContainer,
  initToolContainer,
  setupKeyboardEventListeners,
  showNewGameButtonsAndHideControls,
  updateControlsOnGameStart,
  updateToolContainer,
} from "./controls/controls-component";

let hasSetupEventListeners = false;
const controlsAndInfoComponent: HTMLElement = createElement({ cssClass: styles.controlsAndInfo });

export function getControlsAndInfoComponent(): HTMLElement {
  setupEventListeners();

  const movementContainer = initMovementContainer();
  const toolContainer = initToolContainer();
  const hintButton = initHintButton();

  controlsAndInfoComponent.append(getGameInfoComponent(), movementContainer, toolContainer, hintButton);

  updateToolContainer();
  updateGameInfoComponent();

  if (!globals.gameState && !isOnboarding()) {
    showNewGameButtons(true);
  }

  return controlsAndInfoComponent;
}

function showNewGameButtons(isInitialStart = false) {
  showNewGameButtonsAndHideControls(addNewGameButtons(isInitialStart));
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

  pubSubService.subscribe(PubSubEvent.GAME_END, () => {
    if (!controlsAndInfoComponent) return;

    showNewGameButtons();
  });

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, () => {
    updateGameInfoComponent(true);
  });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    toggleDoOverButtonVisibility(false);
    updateGameInfoComponent();
    updateControlsOnGameStart();
  });

  setupKeyboardEventListeners();

  hasSetupEventListeners = true;
}

function addNewGameButtons(isInitialStart = false) {
  const hasAchievedGoal = isWinConditionMet(globals.gameState) && globals.gameState.moves.length <= getParFromGameState(globals.gameState);

  const newGameContainer = createElement({ cssClass: styles.newGameContainer });

  const continueButton = createButton({
    text: getTranslation(
      isInitialStart
        ? TranslationKey.START_GAME
        : isOnboarding() || hasUnknownConfigItems()
          ? TranslationKey.CONTINUE
          : TranslationKey.NEW_GAME,
    ),
    onClick: () => {
      pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: false });
      newGameContainer.remove();
      hideRetryInfo();
    },
  });

  if (hasAchievedGoal) {
    const newXP = calculateNewXP();
    const xpButton = getCollectXpButton(newXP, () => {
      continueButton.classList.toggle(CssClass.HIDDEN, false);
    });
    newGameContainer.append(xpButton);
    continueButton.classList.toggle(CssClass.HIDDEN, true);
  }

  newGameContainer.append(continueButton);

  if (!isInitialStart && hasMoveLimit() && !hasAchievedGoal) {
    const restartButton = createButton({
      text: getTranslation(TranslationKey.RESTART_GAME),
      cssClass: CssClass.PRIMARY,
      onClick: () => {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: true });
        newGameContainer.remove();
      },
    });

    newGameContainer.append(restartButton);
  } else {
    continueButton.classList.toggle(CssClass.PRIMARY, true);
  }

  return newGameContainer;
}
