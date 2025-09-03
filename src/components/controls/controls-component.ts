import { createButton, createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { ConfigCategory, Difficulty, Direction, isSpecialAction, isTool, RECOVERY_TIME_MAP, Tool, TurnMove } from "../../types";

import styles from "./controls-component.module.scss";
import { getBestNextMove, isValidMove, isWinConditionMet, performMove } from "../../logic/game-logic";
import { getArrowComponent } from "../arrow-component/arrow-component";
import {
  ActiveRecording,
  hasSoundForAction,
  requestMicrophoneAccess,
  saveRecording,
  startRecording,
} from "../../audio/sound-control/sound-control";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { globals } from "../../globals";
import { isOnboarding } from "../../logic/onboarding";

import { hasMoveLimit, showMovesInfo } from "../../logic/config/config";
import { FALLBACK_PAR } from "../../logic/par";
import { getParFromGameState } from "../../logic/data/game-elements";
import { getDifficultyRepresention } from "../../logic/difficulty";

let hasSetupEventListeners = false;
let controlsComponent: HTMLElement | undefined;
let turnMovesContainer: HTMLElement | undefined;
let turnMovesComponent: HTMLElement | undefined;
// let solutionsComponent: HTMLElement | undefined;
let difficultyComponent: HTMLElement | undefined;
let redoButton: HTMLElement | undefined;
let toolContainer: HTMLElement | undefined;
let hintButton: HTMLElement | undefined;
let highlightedElement: HTMLElement | undefined;
let recoveryInfoComponent: HTMLElement | undefined;
let activeRecording: ActiveRecording | undefined;
let toolsFrozenUntilTurn: number | undefined;

export function createControlsComponent(): HTMLElement {
  setupEventListeners();

  controlsComponent = createElement({
    cssClass: styles.controls,
  });

  turnMovesContainer = createElement({ cssClass: styles.movesContainer });

  turnMovesComponent = createElement({
    cssClass: styles.moves,
  });

  // solutionsComponent = createElement({
  //   cssClass: styles.solutions,
  // });

  difficultyComponent = createElement({
    cssClass: styles.difficultyBox,
  });

  redoButton = createElement({
    tag: "a",
    text: getTranslation(TranslationKey.RESTART_GAME),
    cssClass: CssClass.OPACITY_HIDDEN,
    onClick: () => {
      pubSubService.publish(PubSubEvent.START_NEW_GAME, { shouldIncreaseLevel: false });
    },
  });

  turnMovesContainer.appendChild(turnMovesComponent);
  // turnMovesContainer.appendChild(solutionsComponent);
  turnMovesContainer.appendChild(difficultyComponent);
  turnMovesContainer.appendChild(redoButton);

  updateTurnMovesComponent();

  controlsComponent.appendChild(turnMovesContainer);

  const movementContainer = createElement({
    cssClass: styles.movementControls,
  });

  const moveButtons = getAllMoveButtons();
  moveButtons.forEach((button) => movementContainer.appendChild(button));
  // movementContainer.appendChild(createRecordButton([Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]));
  updateMoveButtonsDisabledState();
  controlsComponent.appendChild(movementContainer);

  toolContainer = createElement({
    cssClass: styles.toolControls,
  });

  recoveryInfoComponent = createElement({ cssClass: styles.recoveryInfo });

  // toolContainer.appendChild(createRecordButton([Tool.MEOW]));
  toolContainer.appendChild(getToolButton(Tool.MEOW));
  toolContainer.appendChild(recoveryInfoComponent);
  controlsComponent.appendChild(toolContainer);

  hintButton = createButton({
    text: `🦉 ${getTranslation(TranslationKey.HINT)}`,
    onClick: () => {
      if (!globals.gameState) return;

      hintButton.setAttribute("disabled", "disabled");

      const hint = getBestNextMove(globals.gameState);
      if (hint !== undefined && !isSpecialAction(hint)) {
        activateOnboardingHighlight(hint);
      } else {
        redoButton.classList.remove(CssClass.OPACITY_HIDDEN);
        redoButton.classList.add(styles.onboardingHighlight);
      }
    },
  });
  hintButton.classList.add(CssClass.SECONDARY);
  controlsComponent.appendChild(hintButton);

  updateToolContainer();

  if (!globals.gameState && !isOnboarding()) {
    controlsComponent.appendChild(addNewGameButtons(true));
    controlsComponent.classList.add(styles.disabled);
  }

  return controlsComponent;
}

async function toggleRecordSoundEffect(btn: HTMLButtonElement, actions: TurnMove[]) {
  const ok = await requestMicrophoneAccess();

  if (!ok) {
    return;
  }

  if (activeRecording) {
    activeRecording.done.then((recording) => {
      if (recording) {
        for (const action of actions) {
          saveRecording(action, recording);
        }
      }
    });
    activeRecording.stop();
    btn.textContent = "🎤";
    activeRecording = undefined;
  } else {
    const proceed = !hasSoundForAction(actions[0]) || confirm("Record new sound effect for this action?");

    if (!proceed) return;

    try {
      activeRecording = await startRecording();
      btn.textContent = "🟪";
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(error instanceof Error ? error.message : "unknown error");
    }
  }
}

function createRecordButton(actions: TurnMove[]): HTMLElement {
  const recordButton = createButton({
    text: "🎤",
    cssClass: CssClass.ICON_BTN,
    onClick: () => void toggleRecordSoundEffect(recordButton, actions),
  });

  return recordButton;
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
  return (buttons[tool] ??= createButton({ text: getTranslation(TranslationKey.MEOW), onClick: () => handleMove(tool) }));
}

export function getControlButton(type: Direction | Tool): HTMLElement {
  return isTool(type) ? getToolButton(type) : getMoveButton(type);
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

  pubSubService.subscribe(PubSubEvent.GAME_END, () => {
    if (!controlsComponent) return;

    controlsComponent.appendChild(addNewGameButtons());
  });

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, () => {
    updateTurnMovesComponent(true);
  });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    controlsComponent.classList.remove(styles.disabled);
    redoButton.classList.remove(styles.onboardingHighlight);
    redoButton.classList.toggle(CssClass.OPACITY_HIDDEN, true);
    hintButton.removeAttribute("disabled");
    toolsFrozenUntilTurn = undefined;
    updateRecoveryInfoComponent();
    updateTurnMovesComponent();
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
    text: getTranslation(isInitialStart ? TranslationKey.START_GAME : isOnboarding() ? TranslationKey.CONTINUE : TranslationKey.NEW_GAME),
    onClick: () => {
      pubSubService.publish(PubSubEvent.START_NEW_GAME);
      newGameContainer.remove();
    },
  });
  hasAchievedGoal && continueButton.classList.add(CssClass.PRIMARY);

  newGameContainer.appendChild(continueButton);

  if (!isInitialStart && hasMoveLimit(globals.gameState.setup.config)) {
    const restartButton = createButton({
      text: getTranslation(TranslationKey.RESTART_GAME),
      onClick: () => {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { shouldIncreaseLevel: false });
        newGameContainer.remove();
      },
    });

    if (!hasAchievedGoal && hasMoveLimit(globals.gameState.setup.config)) {
      restartButton.classList.add(CssClass.PRIMARY);
    } else {
      continueButton.classList.toggle(CssClass.PRIMARY, true);
    }

    newGameContainer.appendChild(restartButton);
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
  updateTurnMovesComponent();

  if (isTool(turnMove)) {
    toolsFrozenUntilTurn = globals.gameState.moves.length + RECOVERY_TIME_MAP[turnMove];
  }

  updateRecoveryInfoComponent();
  updateMoveButtonsDisabledState();
}

function updateTurnMovesComponent(isReset: boolean = false) {
  if (!turnMovesContainer) return;

  const showMoves = globals.gameState && showMovesInfo(globals.gameState.setup.config);
  const showMoveLimit = globals.gameState && hasMoveLimit(globals.gameState.setup.config);

  // console.debug("updateTurnMovesComponent", { showMoves, showMoveLimit, isReset, moves: globals.gameState?.moves });

  turnMovesContainer.style.display = showMoves ? "flex" : "none";
  const par = getParFromGameState(globals.gameState);
  const parString = par && showMoveLimit && !isReset ? ` / ${par < FALLBACK_PAR ? par : "?"}` : "";
  turnMovesComponent.innerHTML = `${getTranslation(TranslationKey.MOVES)}: ${isReset ? 0 : (globals.gameState?.moves.length ?? 0)}${parString}`;

  // const solutionsCount = globals.gameState ? getRemainingSolutions(globals.gameState).length : undefined;
  // if (solutionsComponent) {
  //   solutionsComponent.style.display = showMoveLimit ? "flex" : "none";
  //   solutionsComponent.innerHTML = `${getTranslation(TranslationKey.POSSIBLE_SOLUTIONS)}: ${isReset ? "?" : (solutionsCount ?? "?")}`;
  // }

  if (difficultyComponent) {
    const difficulty = globals.gameState?.setup.difficulty;
    difficultyComponent.style.display = showMoveLimit && difficulty ? "flex" : "none";
    difficultyComponent.innerHTML = `${getTranslation(TranslationKey.DIFFICULTY)}: `;
    difficultyComponent.append(
      isReset ? "?" : createElement({ cssClass: getCssClassForDifficulty(difficulty), text: getDifficultyRepresention(difficulty) }),
    );
  }

  // if (redoButton) {
  //   redoButton.style.opacity = isReset || solutionsCount > 0 || !showMoveLimit ? "0" : "1";
  // }
}

function getCssClassForDifficulty(difficulty: Difficulty) {
  switch (difficulty) {
    case Difficulty.EASY:
      return styles.easy;
    case Difficulty.MEDIUM:
      return styles.medium;
    case Difficulty.HARD:
      return styles.hard;
    default:
      return "";
  }
}

function updateRecoveryInfoComponent() {
  if (!recoveryInfoComponent) return;

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

  if (!toolContainer || !globals.gameState) return;

  const shouldHaveTools = Object.values(globals.gameState.setup.config[ConfigCategory.TOOLS]).some(Boolean);

  toolContainer.classList.toggle(styles.hidden, !shouldHaveTools);
}

export function activateOnboardingHighlight(action: Direction | Tool) {
  highlightedElement = getControlButton(action);
  highlightedElement.classList.add(styles.onboardingHighlight);
}
