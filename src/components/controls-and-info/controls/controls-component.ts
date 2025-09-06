import { createButton, createElement } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";
import { ConfigCategory, Direction, isSpecialAction, isTool, RECOVERY_TIME_MAP, Tool, TurnMove } from "../../../types";

import styles from "./controls-component.module.scss";
import { performMove } from "../../../logic/gameplay/perform-move";
import { getArrowComponent } from "../../arrow-component/arrow-component";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { globals } from "../../../globals";
import { isOnboarding } from "../../../logic/onboarding";

import { hasMoveLimit, hasUnknownConfigItems } from "../../../logic/config/config";
import { getParFromGameState } from "../../../logic/data/game-elements";
import { calculateNewXP, getXpInnerHtml, XP_FOR_HINT } from "../../../logic/data/experience-points";
import {
  getGameInfoComponent,
  hideRetryInfo,
  toggleDoOverButtonVisibility,
  updateGameInfoComponent,
} from "../game-info/game-info-component";
import { animateXpFlyAway, getCollectXpButton } from "../../xp-components/xp-components";
import { isValidMove } from "../../../logic/gameplay/movement";
import { getBestNextMove } from "../../../logic/gameplay/hint";
import { isWinConditionMet } from "../../../logic/checks";
import { getMeowTextWithIcon } from "../../cat-component/cat-component";

let hasSetupEventListeners = false;
const controlsComponent: HTMLElement = createElement({ cssClass: styles.controls });

const movementContainer: HTMLElement = createElement({ cssClass: styles.movementControls });
const toolContainer: HTMLElement = createElement({ cssClass: styles.toolControls });
let hintButton: HTMLElement | undefined;
let highlightedElement: HTMLElement | undefined;
const recoveryInfoComponent: HTMLElement = createElement({ cssClass: styles.recoveryInfo });
let toolsFrozenUntilTurn: number | undefined;

export function getControlsComponent(): HTMLElement {
  setupEventListeners();

  const moveButtons = getAllMoveButtons();
  moveButtons.forEach((button) => movementContainer.append(button));
  updateMoveButtonsDisabledState();

  // toolContainer.append(createRecordButton([Tool.MEOW]));
  toolContainer.append(getToolButton(Tool.MEOW), recoveryInfoComponent);

  hintButton = createButton({
    html: `${getTranslation(TranslationKey.HINT)} ${getXpInnerHtml(XP_FOR_HINT)}`,
    onClick: async () => {
      if (!globals.gameState) return;

      hintButton.setAttribute("disabled", "disabled");
      await animateXpFlyAway(getXpInnerHtml(XP_FOR_HINT), hintButton);
      pubSubService.publish(PubSubEvent.UPDATE_XP, XP_FOR_HINT);

      const hint = getBestNextMove(globals.gameState);
      if (hint !== undefined && !isSpecialAction(hint)) {
        activateOnboardingHighlight(hint);
      } else {
        toggleDoOverButtonVisibility(true);
      }
    },
  });
  hintButton.classList.add(CssClass.SECONDARY);

  updateToolContainer();

  controlsComponent.append(getGameInfoComponent(), movementContainer, toolContainer, hintButton);

  updateGameInfoComponent();

  if (!globals.gameState && !isOnboarding()) {
    showNewGameButtons(true);
  }

  return controlsComponent;
}

function showNewGameButtons(isInitialStart = false) {
  movementContainer.append(addNewGameButtons(isInitialStart));
  movementContainer.classList.toggle(styles.disabled, true);
  toolContainer.classList.toggle(CssClass.OPACITY_HIDDEN, true);
  hintButton.classList.toggle(CssClass.OPACITY_HIDDEN, true);
}

function reshowControls() {
  movementContainer.classList.toggle(styles.disabled, false);
  toolContainer.classList.toggle(CssClass.OPACITY_HIDDEN, false);
  hintButton.classList.toggle(CssClass.OPACITY_HIDDEN, false);
}

const allDirections = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];

function getAllMoveButtons(): HTMLElement[] {
  return allDirections.map(getMoveButton);
}

function updateMoveButtonsDisabledState() {
  for (const direction of allDirections) {
    const shouldDisable = globals.gameState && !isValidMove(globals.gameState, direction);
    const button = getMoveButton(direction);

    if (shouldDisable) {
      button.setAttribute("disabled", "disabled");
    } else {
      button.removeAttribute("disabled");
    }
  }
}

const directionStyleMap: { [key in Direction]: string } = {
  [Direction.UP]: styles.up,
  [Direction.RIGHT]: styles.right,
  [Direction.DOWN]: styles.down,
  [Direction.LEFT]: styles.left,
};

const buttons: { [key in Direction | Tool]?: HTMLElement } = {};
export function getMoveButton(direction: Direction): HTMLElement {
  return (buttons[direction] ??= createButton(
    {
      onClick: () => handleMove(direction),
      cssClass: [CssClass.ICON_BTN, directionStyleMap[direction]],
    },
    [getArrowComponent(direction)],
  ));
}

export function getToolButton(tool: Tool) {
  return (buttons[tool] ??= createButton({ text: getMeowTextWithIcon(), onClick: () => handleMove(tool) }));
}

export function getControlButton(type: Direction | Tool): HTMLElement {
  return isTool(type) ? getToolButton(type) : getMoveButton(type);
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

  pubSubService.subscribe(PubSubEvent.GAME_END, () => {
    if (!controlsComponent) return;

    showNewGameButtons();
  });

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, () => {
    updateGameInfoComponent(true);
  });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    controlsComponent.classList.remove(styles.disabled);
    toggleDoOverButtonVisibility(false);
    hintButton.removeAttribute("disabled");
    toolsFrozenUntilTurn = undefined;
    updateRecoveryInfoComponent();
    updateGameInfoComponent();
    updateToolContainer();
    updateMoveButtonsDisabledState();
  });

  document.addEventListener("keydown", (event) => {
    let turnMove: TurnMove | undefined;

    switch (event.key) {
      case "ArrowUp":
        turnMove = Direction.UP;
        break;
      case "ArrowDown":
        turnMove = Direction.DOWN;
        break;
      case "ArrowLeft":
        turnMove = Direction.LEFT;
        break;
      case "ArrowRight":
        turnMove = Direction.RIGHT;
        break;
      case "m": // 'm' for meow
        turnMove = Tool.MEOW;
        break;
    }

    if (turnMove) {
      event.preventDefault(); // Prevent default scrolling behavior
      void handleMove(turnMove);
    }
  });

  hasSetupEventListeners = true;
}

export function addNewGameButtons(isInitialStart = false) {
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
      reshowControls();
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

  if (!isInitialStart && hasMoveLimit(globals.gameState.setup.config) && !hasAchievedGoal) {
    const restartButton = createButton({
      text: getTranslation(TranslationKey.RESTART_GAME),
      onClick: () => {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: true });
        newGameContainer.remove();
        reshowControls();
      },
    });
    restartButton.classList.add(CssClass.PRIMARY);

    newGameContainer.append(restartButton);
  } else {
    continueButton.classList.toggle(CssClass.PRIMARY, true);
  }

  return newGameContainer;
}

async function handleMove(turnMove: TurnMove) {
  if (isTool(turnMove) && toolsFrozenUntilTurn) {
    return;
  }

  if (highlightedElement) {
    highlightedElement.classList.remove(styles.onboardingHighlight);
    highlightedElement = undefined;
  }

  hintButton.removeAttribute("disabled");

  await performMove(globals.gameState, turnMove);
  updateGameInfoComponent();

  if (isTool(turnMove)) {
    toolsFrozenUntilTurn = globals.gameState.moves.length + RECOVERY_TIME_MAP[turnMove];
  }

  updateRecoveryInfoComponent();
  updateMoveButtonsDisabledState();
}

function updateRecoveryInfoComponent() {
  if (!toolsFrozenUntilTurn) {
    recoveryInfoComponent.innerHTML = "";
    toolContainer.classList.remove(styles.disabled);
    return;
  }

  const turnsLeft = toolsFrozenUntilTurn - globals.gameState.moves.length;
  recoveryInfoComponent.innerHTML = `${turnsLeft}`;
  toolContainer.classList.toggle(styles.disabled, turnsLeft > 0);

  if (turnsLeft <= 0) {
    recoveryInfoComponent.innerHTML = "";
    toolsFrozenUntilTurn = undefined;
  }
}

function updateToolContainer() {
  if (hintButton) {
    hintButton.classList.toggle(CssClass.HIDDEN, !globals.gameState || !hasMoveLimit(globals.gameState.setup.config));
  }

  if (!globals.gameState) return;

  const shouldHaveTools = Object.values(globals.gameState.setup.config[ConfigCategory.TOOLS]).some(Boolean);

  toolContainer.classList.toggle(styles.hidden, !shouldHaveTools);
}

export function activateOnboardingHighlight(action: Direction | Tool) {
  highlightedElement = getControlButton(action);
  highlightedElement.classList.add(styles.onboardingHighlight);
}
