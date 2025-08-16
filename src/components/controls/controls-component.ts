import { createButton, createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { Direction, Tool, TurnMove } from "../../types";

import "./controls-component.scss";
import { performMove } from "../../logic/game-logic";
import { getArrowComponent } from "../arrow-component/arrow-component";

let hasSetupEventListeners = false;
let controlsComponent: HTMLElement | undefined;

export function getControlsComponent(): HTMLElement {
  setupEventListeners();

  controlsComponent = createElement({
    cssClass: CssClass.CONTROLS,
  });

  const movementContainer = createElement({
    cssClass: CssClass.MOVEMENT_CONTROLS,
  });

  const moveButtons = getAllMoveButtons();
  moveButtons.forEach((button) => movementContainer.appendChild(button));

  controlsComponent.appendChild(movementContainer);

  const toolContainer = createElement({
    cssClass: CssClass.TOOL_CONTROLS,
  });

  const startButton = createButton({
    text: "Meow",
    onClick: () => performMove(Tool.MEOW),
  });

  toolContainer.appendChild(startButton);
  controlsComponent.appendChild(toolContainer);

  return controlsComponent;
}

function getAllMoveButtons(): HTMLElement[] {
  return [getMoveButton(Direction.UP), getMoveButton(Direction.RIGHT), getMoveButton(Direction.DOWN), getMoveButton(Direction.LEFT)];
}

function getMoveButton(direction: Direction): HTMLElement {
  const button = createButton({
    text: "",
    onClick: () => handleMoveButtonClick(direction),
    iconBtn: true,
  });

  const arrow = getArrowComponent(direction, false);
  button.append(arrow);

  return button;
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

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
      void performMove(turnMove);
    }
  });

  hasSetupEventListeners = true;
}

async function handleMoveButtonClick(direction: Direction) {
  await performMove(direction);
}
