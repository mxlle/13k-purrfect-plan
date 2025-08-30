import { createButton, createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { Direction, isTool, RECOVERY_TIME_MAP, Tool, TurnMove } from "../../types";

import styles from "./controls-component.module.scss";
import { styles as catStyles } from "../cat-component/cat-component";
import { getPossibleSolutionsCount, isWinConditionMet, performMove } from "../../logic/game-logic";
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

import { ConfigCategory, hasMoveLimit } from "../../logic/config/config";
import { FALLBACK_PAR } from "../../logic/par";
import { getParFromGameState } from "../../logic/data/game-elements";

export { styles };

let hasSetupEventListeners = false;
let controlsComponent: HTMLElement | undefined;
let turnMovesContainer: HTMLElement | undefined;
let turnMovesComponent: HTMLElement | undefined;
let solutionsComponent: HTMLElement | undefined;
let toolContainer: HTMLElement | undefined;
let recoveryInfoComponent: HTMLElement | undefined;
let activeRecording: ActiveRecording | undefined;
let toolsFrozenUntilTurn: number | undefined;

export function getControlsComponent(): HTMLElement {
  setupEventListeners();

  controlsComponent = createElement({
    cssClass: styles.controls,
  });

  turnMovesContainer = createElement({ cssClass: styles.movesContainer });

  turnMovesComponent = createElement({
    cssClass: styles.moves,
  });

  solutionsComponent = createElement({
    cssClass: styles.solutions,
  });

  turnMovesContainer.appendChild(turnMovesComponent);
  turnMovesContainer.appendChild(solutionsComponent);

  updateTurnMovesComponent();

  controlsComponent.appendChild(turnMovesContainer);

  const movementContainer = createElement({
    cssClass: styles.movementControls,
  });

  const moveButtons = getAllMoveButtons();
  moveButtons.forEach((button) => movementContainer.appendChild(button));
  // movementContainer.appendChild(createRecordButton([Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]));

  controlsComponent.appendChild(movementContainer);

  toolContainer = createElement({
    cssClass: styles.toolControls,
  });

  const meowButton = createButton({
    text: "Meow",
    onClick: () => handleMove(Tool.MEOW),
  });
  meowButton.classList.add(catStyles.meow);

  recoveryInfoComponent = createElement({ cssClass: styles.recoveryInfo });

  // toolContainer.appendChild(createRecordButton([Tool.MEOW]));
  toolContainer.appendChild(meowButton);
  toolContainer.appendChild(recoveryInfoComponent);
  controlsComponent.appendChild(toolContainer);

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
    iconBtn: true,
    onClick: () => void toggleRecordSoundEffect(recordButton, actions),
  });

  return recordButton;
}

function getAllMoveButtons(): HTMLElement[] {
  return [getMoveButton(Direction.UP), getMoveButton(Direction.RIGHT), getMoveButton(Direction.DOWN), getMoveButton(Direction.LEFT)];
}

function getMoveButton(direction: Direction): HTMLElement {
  const button = createButton({
    text: "",
    onClick: () => handleMove(direction),
    iconBtn: true,
  });

  const arrow = getArrowComponent(direction);
  button.append(arrow);

  return button;
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

  pubSubService.subscribe(PubSubEvent.GAME_END, () => {
    if (!controlsComponent) return;

    controlsComponent.appendChild(addNewGameButtons());
  });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    controlsComponent.classList.remove(styles.disabled);
    toolsFrozenUntilTurn = undefined;
    updateRecoveryInfoComponent();
    updateTurnMovesComponent();
    updateToolContainer();
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

  if (!isOnboarding() && !isInitialStart) {
    const restartButton = createButton({
      text: getTranslation(TranslationKey.RESTART_GAME),
      onClick: () => {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { shouldIncreaseLevel: false });
        newGameContainer.remove();
      },
    });

    !hasAchievedGoal && restartButton.classList.add(CssClass.PRIMARY);
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

  await performMove(globals.gameState, turnMove);
  updateTurnMovesComponent();

  if (isTool(turnMove)) {
    toolsFrozenUntilTurn = globals.gameState.moves.length + RECOVERY_TIME_MAP[turnMove];
  }

  updateRecoveryInfoComponent();
}

function updateTurnMovesComponent() {
  if (!turnMovesContainer) return;

  const showMoves = globals.gameState && hasMoveLimit(globals.gameState.setup);

  turnMovesContainer.style.display = showMoves ? "flex" : "none";
  const par = getParFromGameState(globals.gameState);
  const parString = par ? ` / ${par < FALLBACK_PAR ? par : "?"}` : "";
  turnMovesComponent.innerHTML = `${getTranslation(TranslationKey.MOVES)}: ${globals.gameState?.moves.length ?? 0}${parString}`;

  if (!solutionsComponent) return;
  solutionsComponent.style.display = showMoves ? "flex" : "none";
  const solutionsCount = getPossibleSolutionsCount(globals.gameState);
  solutionsComponent.innerHTML = `${getTranslation(TranslationKey.POSSIBLE_SOLUTIONS)}: ${solutionsCount ?? "?"}`;

  if (solutionsCount === 0) {
    const redoButton = createElement({
      tag: "a",
      text: getTranslation(TranslationKey.RESTART_GAME),
      onClick: () => {
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { shouldIncreaseLevel: false });
      },
    });

    solutionsComponent.appendChild(redoButton);
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
  if (!toolContainer || !globals.gameState) return;

  const shouldHaveTools = Object.values(globals.gameState.setup.config[ConfigCategory.TOOLS]).some(Boolean);

  toolContainer.classList.toggle(styles.hidden, !shouldHaveTools);
}
