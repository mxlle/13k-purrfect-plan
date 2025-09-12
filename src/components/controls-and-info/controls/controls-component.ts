import { addBodyClasses, createButton, createElement } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";
import { ALL_TOOLS, Direction, isDirection, isTool, Tool, TurnMove } from "../../../types";

import styles from "./controls-component.module.scss";
import { performMove } from "../../../logic/gameplay/perform-move";
import { getArrowComponent } from "../../arrow-component/arrow-component";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { globals } from "../../../globals";

import { getToolText, hasMoveLimit, isConfigItemEnabled } from "../../../logic/config/config";
import { getXpText, XP_FOR_HINT } from "../../../logic/data/experience-points";
import { toggleDoOverButtonVisibility, updateGameInfoComponent } from "../game-info/game-info-component";
import { animateXpFlyAway } from "../../xp-components/xp-components";
import { isValidMove } from "../../../logic/gameplay/movement";
import { getBestNextMove } from "../../../logic/gameplay/hint";
import { getRemainingToolRecoveryTime } from "../../../logic/checks";

const movementContainer: HTMLElement = createElement({ cssClass: styles.movementControls });
const toolContainer: HTMLElement = createElement({ cssClass: styles.toolControls });
let hintButton: HTMLButtonElement | undefined;
let highlightedElement: HTMLElement | undefined;
const recoveryInfoComponent: HTMLElement = createElement({ cssClass: styles.recoveryInfo });

const allDirections = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];

const HINT = "hint" as const;
type Action = Direction | Tool | typeof HINT;

const KEYMAP: Record<KeyboardEvent["key"], Action> = {
  "ArrowUp": Direction.UP,
  "ArrowDown": Direction.DOWN,
  "ArrowLeft": Direction.LEFT,
  "ArrowRight": Direction.RIGHT,
  "w": Direction.UP,
  "a": Direction.LEFT,
  "s": Direction.DOWN,
  "d": Direction.RIGHT,
  "e": Tool.MEOW,
  "q": Tool.WAIT,
  "F1": HINT,
};

export function initMovementContainer(): HTMLElement {
  movementContainer.innerHTML = "";
  const moveButtons = allDirections.map(getMoveButton);
  moveButtons.forEach((button) => movementContainer.append(button));
  updateMoveButtonsDisabledState();

  return movementContainer;
}

export function initToolContainer(): HTMLElement {
  toolContainer.innerHTML = "";
  // toolContainer.append(createRecordButton([Tool.MEOW]));
  const meowButton = getToolButton(Tool.MEOW);
  meowButton.append(recoveryInfoComponent);
  toolContainer.append(meowButton, getToolButton(Tool.WAIT));

  return toolContainer;
}

export function initHintButton(): HTMLButtonElement {
  return (hintButton ??= createButton(
    {
      cssClass: CssClass.SECONDARY,
      onClick: async () => {
        if (!globals.gameState) return;

        hintButton.disabled = true;
        await animateXpFlyAway(getXpText(XP_FOR_HINT), hintButton);
        pubSubService.publish(PubSubEvent.UPDATE_XP, XP_FOR_HINT);

        const hint = getBestNextMove(globals.gameState);
        if (hint !== undefined) {
          activateOnboardingHighlight(hint);
        } else {
          toggleDoOverButtonVisibility(true);
        }
      },
    },
    [getTranslation(TranslationKey.HINT), " ", getXpText(XP_FOR_HINT), createKeyboardHint(HINT)],
  ));
}

export function updateControlsOnGameStart() {
  hintButton.disabled = false;
  updateRecoveryInfoComponent();
  updateToolContainer();
  updateMoveButtonsDisabledState();
  reshowControls();
}

export function showNewGameButtonsAndHideControls(newGameButtonContainer: HTMLElement) {
  movementContainer.append(newGameButtonContainer);
  movementContainer.classList.toggle(styles.disabled, true);
  toolContainer.classList.toggle(CssClass.OPACITY_HIDDEN, true);
  hintButton.classList.toggle(CssClass.OPACITY_HIDDEN, true);
  newGameButtonContainer.querySelector<HTMLButtonElement>(`button.${CssClass.PRIMARY}`).focus();
}

function reshowControls() {
  movementContainer.classList.toggle(styles.disabled, false);
  toolContainer.classList.toggle(CssClass.OPACITY_HIDDEN, false);
  hintButton.classList.toggle(CssClass.OPACITY_HIDDEN, false);
}

function updateMoveButtonsDisabledState() {
  for (const direction of allDirections) {
    const shouldDisable = globals.gameState && !isValidMove(globals.gameState, direction);
    const button = getMoveButton(direction);
    button.disabled = shouldDisable;
  }
}

const directionStyleMap: { [key in Direction]: string } = {
  [Direction.UP]: styles.up,
  [Direction.RIGHT]: styles.right,
  [Direction.DOWN]: styles.down,
  [Direction.LEFT]: styles.left,
};

function createKeyboardHint(action: Action) {
  return createElement({
    tag: "kbd",
    text: Object.entries(KEYMAP)
      .find(([key, val]) => val === action && key.length <= 2)?.[0]
      .toUpperCase(),
  });
}

const buttons: { [key in Direction | Tool]?: HTMLButtonElement } = {};
function getMoveButton(direction: Direction): HTMLButtonElement {
  return (buttons[direction] ??= createButton(
    {
      onClick: () => handleMove(direction),
      cssClass: [CssClass.ICON_BTN, directionStyleMap[direction]],
    },
    [getArrowComponent(direction), createKeyboardHint(direction)],
  ));
}

function getToolButton(tool: Tool) {
  return (buttons[tool] ??= createButton({ onClick: () => handleMove(tool) }, [
    createElement({ tag: "span" }, [getToolText(tool)]),
    createKeyboardHint(tool),
  ]));
}

function getControlButton(type: Direction | Tool): HTMLElement {
  return isTool(type) ? getToolButton(type) : getMoveButton(type);
}

export function setupKeyboardEventListeners() {
  document.addEventListener("keydown", (event) => {
    const action = KEYMAP[event.key];
    if (!action) return;
    event.preventDefault(); // Prevent default scrolling behavior
    addBodyClasses(styles.keyboardActive);

    if (!movementContainer.classList.contains(styles.disabled)) {
      // During game
      if (action === HINT) {
        hintButton.click();
      } else {
        void handleMove(action);
      }
    } else if (isDirection(action)) {
      // Focus next new game button
      const buttons = movementContainer.querySelectorAll<HTMLButtonElement>(`& div button:not(.${CssClass.HIDDEN})`).values().toArray();
      const current = buttons.indexOf(document.activeElement as any);
      console.log({ buttons, current, action });
      buttons[(current + 1) % buttons.length].focus();
    }
  });
}

async function handleMove(turnMove: TurnMove) {
  if (highlightedElement) {
    highlightedElement.classList.remove(styles.onboardingHighlight);
    highlightedElement = undefined;
  }

  hintButton.disabled = false;

  await performMove(globals.gameState, turnMove);
  updateGameInfoComponent();

  updateRecoveryInfoComponent();
  updateMoveButtonsDisabledState();
}

function updateRecoveryInfoComponent() {
  if (!globals.gameState) return;

  const remainingRecoveryTime = getRemainingToolRecoveryTime(globals.gameState, Tool.MEOW);

  recoveryInfoComponent.innerHTML = `${remainingRecoveryTime || ""}`;
  getToolButton(Tool.MEOW).classList.toggle(styles.disabled, remainingRecoveryTime > 0);
}

export function updateToolContainer() {
  if (hintButton) {
    hintButton.classList.toggle(CssClass.HIDDEN, !globals.gameState || !hasMoveLimit());
  }

  if (!globals.gameState) return;

  const shouldHaveTools = ALL_TOOLS.some((tool) => isConfigItemEnabled(tool));

  toolContainer.classList.toggle(CssClass.HIDDEN, !shouldHaveTools);

  for (const tool of ALL_TOOLS) {
    getToolButton(tool).classList.toggle(CssClass.HIDDEN, !isConfigItemEnabled(tool));
  }
}

export function activateOnboardingHighlight(action: Direction | Tool) {
  highlightedElement = getControlButton(action);
  highlightedElement.classList.add(styles.onboardingHighlight);
}
