import { createButton, createElement } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";
import { ALL_TOOLS, Direction, isTool, Tool, TurnMove } from "../../../types";

import styles from "./controls-component.module.scss";
import { performMove } from "../../../logic/gameplay/perform-move";
import { getArrowComponent } from "../../arrow-component/arrow-component";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { getTranslation } from "../../../translations/i18n";
import { TranslationKey } from "../../../translations/translationKey";
import { globals } from "../../../globals";

import { getToolText, hasMoveLimit, isKnownTool } from "../../../logic/config/config";
import { getXpInnerHtml, XP_FOR_HINT } from "../../../logic/data/experience-points";
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
  if (hintButton) {
    return hintButton;
  }

  hintButton = createButton({
    html: `${getTranslation(TranslationKey.HINT)} ${getXpInnerHtml(XP_FOR_HINT)}`,
    cssClass: CssClass.SECONDARY,
    onClick: async () => {
      if (!globals.gameState) return;

      hintButton.setAttribute("disabled", "disabled");
      await animateXpFlyAway(getXpInnerHtml(XP_FOR_HINT), hintButton);
      pubSubService.publish(PubSubEvent.UPDATE_XP, XP_FOR_HINT);

      const hint = getBestNextMove(globals.gameState);
      if (hint !== undefined) {
        activateOnboardingHighlight(hint);
      } else {
        toggleDoOverButtonVisibility(true);
      }
    },
  });

  return hintButton;
}

export function updateControlsOnGameStart() {
  hintButton.removeAttribute("disabled");
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
function getMoveButton(direction: Direction): HTMLElement {
  return (buttons[direction] ??= createButton(
    {
      onClick: () => handleMove(direction),
      cssClass: [CssClass.ICON_BTN, directionStyleMap[direction]],
    },
    [getArrowComponent(direction)],
  ));
}

function getToolButton(tool: Tool) {
  return (buttons[tool] ??= createButton({ html: `<span>${getToolText(tool)}</span>`, onClick: () => handleMove(tool) }));
}

function getControlButton(type: Direction | Tool): HTMLElement {
  return isTool(type) ? getToolButton(type) : getMoveButton(type);
}

export function setupKeyboardEventListeners() {
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
}

async function handleMove(turnMove: TurnMove) {
  if (highlightedElement) {
    highlightedElement.classList.remove(styles.onboardingHighlight);
    highlightedElement = undefined;
  }

  hintButton.removeAttribute("disabled");

  await performMove(globals.gameState, turnMove);
  updateGameInfoComponent();

  updateRecoveryInfoComponent();
  updateMoveButtonsDisabledState();
}

function updateRecoveryInfoComponent() {
  if (!globals.gameState) return;

  const remainingRecoveryTime = getRemainingToolRecoveryTime(globals.gameState, Tool.MEOW);

  if (!remainingRecoveryTime) {
    recoveryInfoComponent.innerHTML = "";
    getToolButton(Tool.MEOW).classList.remove(styles.disabled);
    return;
  }

  recoveryInfoComponent.innerHTML = `${remainingRecoveryTime}`;
  getToolButton(Tool.MEOW).classList.toggle(styles.disabled, remainingRecoveryTime > 0);
}

export function updateToolContainer() {
  if (hintButton) {
    hintButton.classList.toggle(CssClass.HIDDEN, !globals.gameState || !hasMoveLimit(globals.gameState.setup.config));
  }

  if (!globals.gameState) return;

  const shouldHaveTools = ALL_TOOLS.some((tool) => isKnownTool(globals.gameState.setup.config, tool));

  toolContainer.classList.toggle(CssClass.HIDDEN, !shouldHaveTools);

  for (const tool of ALL_TOOLS) {
    getToolButton(tool).classList.toggle(CssClass.HIDDEN, !isKnownTool(globals.gameState.setup.config, tool));
  }
}

export function activateOnboardingHighlight(action: Direction | Tool) {
  highlightedElement = getControlButton(action);
  highlightedElement.classList.add(styles.onboardingHighlight);
}
