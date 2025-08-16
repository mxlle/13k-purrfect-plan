import { createButton, createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { Direction } from "../../types";

import "./controls-component.scss";
import { performMove } from "../../logic/game-logic";

let hasSetupEventListeners = false;

export function getControlsComponent(): HTMLElement {
  setupEventListeners();

  const controlsComponent = createElement({
    cssClass: CssClass.CONTROLS,
  });

  const movementContainer = createElement({
    cssClass: CssClass.MOVEMENT_CONTROLS,
  });

  const moveButtons = getAllMoveButtons();
  moveButtons.forEach((button) => movementContainer.appendChild(button));

  controlsComponent.appendChild(movementContainer);

  // const actionContainer = createElement({
  //   cssClass: CssClass.ACTION_CONTROLS,
  // });
  //
  // const startButton = createButton({
  //   text: "Start",
  //   onClick: () => console.log("Start button clicked"),
  // });

  // actionContainer.appendChild(startButton);
  // controlsComponent.appendChild(actionContainer);

  return controlsComponent;
}

function getAllMoveButtons(): HTMLElement[] {
  return [getMoveButton(Direction.UP), getMoveButton(Direction.RIGHT), getMoveButton(Direction.DOWN), getMoveButton(Direction.LEFT)];
}

function getMoveButton(direction: Direction): HTMLElement {
  const button = createButton({
    text: getDirectionButtonText(direction),
    onClick: () => handleMoveButtonClick(direction),
    iconBtn: true,
  });

  return button;
}

export function getDirectionButtonText(direction: Direction): string {
  switch (direction) {
    case Direction.UP:
      return "⬆️";
    case Direction.DOWN:
      return "⬇️";
    case Direction.LEFT:
      return "⬅️";
    case Direction.RIGHT:
      return "➡️";
    default:
      return "";
  }
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowUp":
        performMove(Direction.UP);
        break;
      case "ArrowDown":
        performMove(Direction.DOWN);
        break;
      case "ArrowLeft":
        performMove(Direction.LEFT);
        break;
      case "ArrowRight":
        performMove(Direction.RIGHT);
        break;
    }
  });

  hasSetupEventListeners = true;
}

function handleMoveButtonClick(direction: Direction) {
  performMove(direction);
}
