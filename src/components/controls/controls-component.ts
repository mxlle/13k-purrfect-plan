import { createButton, createElement, resetTransform } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { ConfigCategory, Difficulty, Direction, isSpecialAction, isTool, RECOVERY_TIME_MAP, Tool, TurnMove } from "../../types";

import styles from "./controls-component.module.scss";
import { getBestNextMove, isValidMove, isWinConditionMet, performMove } from "../../logic/game-logic";
import { getArrowComponent } from "../arrow-component/arrow-component";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { globals } from "../../globals";
import { isOnboarding } from "../../logic/onboarding";

import { hasMoveLimit, hasUnknownConfigItems, showMovesInfo } from "../../logic/config/config";
import { FALLBACK_PAR } from "../../logic/par";
import { getParFromGameState } from "../../logic/data/game-elements";
import { getDifficultyRepresention } from "../../logic/difficulty";
import { calculateNewXP, getXPString, XP_FOR_HINT, XP_REP } from "../../logic/data/experience-points";
import { requestAnimationFrameWithTimeout, sleep } from "../../utils/promise-utils";

let hasSetupEventListeners = false;
const controlsComponent: HTMLElement = createElement({ cssClass: styles.controls });
const turnMovesContainer: HTMLElement = createElement({ cssClass: styles.movesContainer });
const turnMovesComponent: HTMLElement = createElement({ cssClass: styles.moves });
const difficultyComponent: HTMLElement = createElement({ cssClass: styles.difficultyBox });
const retryInfo: HTMLElement = createElement({ cssClass: styles.retryInfo });
let redoButton: HTMLElement | undefined;
const movementContainer: HTMLElement = createElement({ cssClass: styles.movementControls });
const toolContainer: HTMLElement = createElement({ cssClass: styles.toolControls });
let hintButton: HTMLElement | undefined;
let highlightedElement: HTMLElement | undefined;
const recoveryInfoComponent: HTMLElement = createElement({ cssClass: styles.recoveryInfo });
let toolsFrozenUntilTurn: number | undefined;

export function getControlsComponent(): HTMLElement {
  setupEventListeners();

  redoButton = createElement({
    tag: "a",
    text: getTranslation(TranslationKey.RESTART_GAME),
    cssClass: CssClass.OPACITY_HIDDEN,
    onClick: () => {
      pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: true });
    },
  });

  turnMovesContainer.append(turnMovesComponent, difficultyComponent, retryInfo, redoButton);

  updateTurnMovesComponent();

  const moveButtons = getAllMoveButtons();
  moveButtons.forEach((button) => movementContainer.append(button));
  updateMoveButtonsDisabledState();

  // toolContainer.append(createRecordButton([Tool.MEOW]));
  toolContainer.append(getToolButton(Tool.MEOW), recoveryInfoComponent);

  hintButton = createButton({
    text: `${getTranslation(TranslationKey.HINT)} ${getXPString(XP_FOR_HINT)}`,
    onClick: async () => {
      if (!globals.gameState) return;

      hintButton.setAttribute("disabled", "disabled");
      await animateXpFlyAway(getXPString(XP_FOR_HINT), hintButton);
      pubSubService.publish(PubSubEvent.UPDATE_XP, XP_FOR_HINT);

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

  updateToolContainer();

  controlsComponent.append(turnMovesContainer, movementContainer, toolContainer, hintButton);

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
  return (buttons[tool] ??= createButton({ text: getTranslation(TranslationKey.MEOW), onClick: () => handleMove(tool) }));
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
      retryInfo?.classList.toggle(CssClass.HIDDEN, true);
      reshowControls();
    },
  });

  if (hasAchievedGoal) {
    const newXP = calculateNewXP();
    const xpButton = createButton({
      text: getTranslation(TranslationKey.COLLECT_XP, getXPString(newXP)),
      onClick: async () => {
        sleep(500).then(() => {
          pubSubService.publish(PubSubEvent.UPDATE_XP, newXP);
        });
        await flyMultipleXpAway(newXP, xpButton);
        xpButton.classList.toggle(CssClass.HIDDEN, true);
        continueButton.classList.toggle(CssClass.HIDDEN, false);
      },
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
  updateTurnMovesComponent();

  if (isTool(turnMove)) {
    toolsFrozenUntilTurn = globals.gameState.moves.length + RECOVERY_TIME_MAP[turnMove];
  }

  updateRecoveryInfoComponent();
  updateMoveButtonsDisabledState();
}

function updateTurnMovesComponent(isReset: boolean = false) {
  const showMoves = globals.gameState && showMovesInfo(globals.gameState.setup.config);
  const showMoveLimit = globals.gameState && hasMoveLimit(globals.gameState.setup.config);

  // console.debug("updateTurnMovesComponent", { showMoves, showMoveLimit, isReset, moves: globals.gameState?.moves });

  turnMovesContainer.style.display = showMoves ? "flex" : "none";
  const par = getParFromGameState(globals.gameState);
  const parString = par && showMoveLimit && !isReset ? ` / ${par < FALLBACK_PAR ? par : "?"}` : "";
  turnMovesComponent.innerHTML = `${getTranslation(TranslationKey.MOVES)}: ${isReset ? 0 : (globals.gameState?.moves.length ?? 0)}${parString}`;

  const difficulty = globals.gameState?.setup.difficulty;
  difficultyComponent.style.display = showMoveLimit && difficulty ? "flex" : "none";
  difficultyComponent.innerHTML = `${getTranslation(TranslationKey.DIFFICULTY)}: `;
  difficultyComponent.append(
    isReset ? "?" : createElement({ cssClass: getCssClassForDifficulty(difficulty), text: getDifficultyRepresention(difficulty) }),
  );

  retryInfo.classList.toggle(CssClass.HIDDEN, globals.failedAttempts === 0);
  retryInfo.innerHTML = `${getTranslation(TranslationKey.RETRIES)}: ${Array.from({ length: globals.failedAttempts }, () => "I").join("")}`;
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

async function flyMultipleXpAway(xp: number, source: HTMLElement) {
  const delay = 500 / xp;
  for (let i = 0; i < xp; i++) {
    const mod = i / xp;
    const xMod = 0.5 + (i % 2 === 0 ? -1 : 1) * mod * 0.3;
    const hueRotate = mod * 360;
    void animateXpFlyAway(XP_REP, source, xMod, hueRotate);

    await requestAnimationFrameWithTimeout(delay);
  }
}

async function animateXpFlyAway(text: string, source: HTMLElement, xMod: number = 0.5, hueRotate: number = 0) {
  // console.debug("animateXpFlyAway", { text, xMod });
  const flyAwayElement = createElement({ text, cssClass: styles.flyAwayElement });
  const sourceRect = source.getBoundingClientRect();
  const diffXFromTopRight = sourceRect.right - document.body.clientWidth;
  const diffYFromTopRight = sourceRect.top - sourceRect.height / 2;
  const additionalOffset = sourceRect.width * xMod * -1;

  flyAwayElement.style.setProperty(
    "transform",
    `translate(calc(50% + ${diffXFromTopRight + additionalOffset}px), calc(50% + ${diffYFromTopRight}px)) scale(2)`,
  );
  flyAwayElement.style.setProperty("filter", `hue-rotate(${hueRotate}deg)`);
  document.body.append(flyAwayElement);

  await requestAnimationFrameWithTimeout(0);

  flyAwayElement.classList.add(CssClass.OPACITY_HIDDEN);

  resetTransform(flyAwayElement);

  await sleep(500);

  sleep(500).then(() => {
    flyAwayElement.remove();
  });
}
