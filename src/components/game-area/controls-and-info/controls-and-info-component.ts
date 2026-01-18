import { isWinConditionMet } from "../../../logic/checks";
import { globals } from "../../../globals";
import { getParFromGameState } from "../../../logic/data/game-elements";
import { createButton, createElement } from "../../../utils/html-utils";
import styles from "./controls-and-info-component.module.scss";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { hasMoveLimit, isConfigItemEnabled } from "../../../logic/config/config";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import {
  getGameInfoComponent,
  hideRetryInfo,
  toggleDoOverButtonVisibility,
  updateGameInfoComponent,
} from "./game-info/game-info-component";
import { calculateNewXP, getXpInnerHtml } from "../../../logic/data/experience-points";
import { CssClass } from "../../../utils/css-class";
import {
  initHintButton,
  initMovementContainer,
  initToolContainer,
  setupKeyboardEventListeners,
  showNewGameButtonsAndHideControls,
  updateControlsOnGameStart,
  updateToolContainer,
} from "./controls/controls-component";
import { collectXp } from "../../global-elements/xp-components/xp-components";
import { sleep } from "../../../utils/promise-utils";
import { HAS_RECORDED_SOUND_EFFECTS, HAS_SHORT_TEXTS } from "../../../env-utils";
import { createRecordButton } from "./create-record-button";
import { Tool } from "../../../types";
import { openLevelSelection } from "../../level-selection/level-selection";
import { getCurrentHighestLevelIndex, isOnboardingLevel, readableLevel } from "../../../logic/levels";
import { deserializeGame } from "../../../logic/serializer";

let hasSetupEventListeners = false;
const controlsAndInfoComponent: HTMLElement = createElement({ cssClass: styles.controlsAndInfo });
let recordButton: HTMLElement | undefined;

export function getControlsAndInfoComponent(): HTMLElement {
  setupEventListeners();

  controlsAndInfoComponent.append(getGameInfoComponent(), initMovementContainer(), initToolContainer(), initHintButton());

  if (HAS_RECORDED_SOUND_EFFECTS) {
    recordButton = createRecordButton([Tool.MEOW]);
    controlsAndInfoComponent.append(recordButton);
    recordButton.classList.toggle(CssClass.OPACITY_HIDDEN, !isConfigItemEnabled(Tool.MEOW));
  }

  updateToolContainer();
  updateGameInfoComponent();

  if (!globals.gameState) {
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

  pubSubService.subscribe(PubSubEvent.GAME_START, async () => {
    await sleep(0); // to make sure the state is settled
    toggleDoOverButtonVisibility(false);
    updateGameInfoComponent();
    updateControlsOnGameStart();
    recordButton?.classList.toggle(CssClass.OPACITY_HIDDEN, !isConfigItemEnabled(Tool.MEOW));
  });

  setupKeyboardEventListeners();

  hasSetupEventListeners = true;
}

function addNewGameButtons(isInitialStart = false) {
  const hasAchievedGoal =
    isWinConditionMet(globals.gameState) && (!hasMoveLimit() || globals.gameState.moves.length <= getParFromGameState(globals.gameState));
  const shouldShowRedoButton = !isInitialStart && hasMoveLimit() && !hasAchievedGoal;
  const newXp = hasAchievedGoal ? calculateNewXP() : 0;
  let hasCollectedXp = false;
  let xpElement: HTMLElement | undefined;

  const newGameContainer = createElement({ cssClass: styles.newGameContainer });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    newGameContainer.remove();
  });

  if (hasAchievedGoal) {
    xpElement = createElement({
      html: HAS_SHORT_TEXTS ? `+${getXpInnerHtml(newXp)}` : getTranslation(TranslationKey.COLLECT_XP, getXpInnerHtml(newXp)),
      cssClass: styles.xpInfo,
    });
  }

  const continueButton = createButton({
    text: getTranslation(
      isInitialStart ? TranslationKey.START_GAME : shouldShowRedoButton ? TranslationKey.NEW_GAME : TranslationKey.CONTINUE,
    ),
    cssClass: CssClass.PRIMARY,
    onClick: async () => {
      if (hasAchievedGoal && !hasCollectedXp) {
        hasCollectedXp = true;
        continueButton.disabled = true;
        xpElement?.classList.add(CssClass.OPACITY_HIDDEN);
        await collectXp(continueButton, newXp);
      }

      if (isOnboardingLevel()) {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, {
          isDoOver: false,
          gameSetup: deserializeGame(readableLevel(getCurrentHighestLevelIndex()).toString()),
        });
        newGameContainer.remove();
      } else {
        openLevelSelection((isSubmit: boolean) => {
          continueButton.disabled = false;
          isSubmit && hideRetryInfo();
        });
      }
    },
  });

  newGameContainer.append(continueButton);

  if (xpElement) newGameContainer.append(xpElement);

  if (shouldShowRedoButton) {
    const restartButton = createButton({
      text: getTranslation(TranslationKey.RESTART_GAME),
      cssClass: CssClass.PRIMARY,
      onClick: () => {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: true });
        newGameContainer.remove();
      },
    });

    continueButton.classList.remove(CssClass.PRIMARY);
    newGameContainer.append(restartButton);
  }

  return newGameContainer;
}
