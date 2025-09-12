import { isWinConditionMet } from "../../logic/checks";
import { globals } from "../../globals";
import { getParFromGameState } from "../../logic/data/game-elements";
import { createButton, createElement } from "../../utils/html-utils";
import styles from "./controls-and-info-component.module.scss";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { isOnboarding } from "../../logic/onboarding";
import { hasMoveLimit } from "../../logic/config/config";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import {
  getGameInfoComponent,
  hideRetryInfo,
  toggleDoOverButtonVisibility,
  updateGameInfoComponent,
} from "./game-info/game-info-component";
import { calculateNewXP, getXpText } from "../../logic/data/experience-points";
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
import { collectXp } from "../xp-components/xp-components";

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
  const shouldShowRedoButton = !isInitialStart && hasMoveLimit() && !hasAchievedGoal;
  const newXp = hasAchievedGoal ? calculateNewXP() : 0;

  const newGameContainer = createElement({ cssClass: styles.newGameContainer });

  const continueButton = createButton({
    text: getTranslation(
      isInitialStart ? TranslationKey.START_GAME : shouldShowRedoButton ? TranslationKey.NEW_GAME : TranslationKey.CONTINUE,
    ),
    onClick: async () => {
      if (hasAchievedGoal) {
        await collectXp(continueButton, newXp);
      }

      pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: false });
      newGameContainer.remove();
      hideRetryInfo();
    },
  });

  newGameContainer.append(continueButton);

  if (hasAchievedGoal) {
    const xpElement = createElement({
      text: getTranslation(TranslationKey.COLLECT_XP, getXpText(newXp)),
      cssClass: styles.xpInfo,
    });
    newGameContainer.append(xpElement);
  }

  if (shouldShowRedoButton) {
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
