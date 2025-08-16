import { createButton, createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { Direction } from "../../types";

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
    let direction: Direction | undefined;

    switch (event.key) {
      case "ArrowUp":
        direction = Direction.UP;
        break;
      case "ArrowDown":
        direction = Direction.DOWN;
        break;
      case "ArrowLeft":
        direction = Direction.LEFT;
        break;
      case "ArrowRight":
        direction = Direction.RIGHT;
        break;
    }

    if (direction) {
      event.preventDefault(); // Prevent default scrolling behavior
      handleMoveButtonClick(direction);
    }
  });

  hasSetupEventListeners = true;
}

async function handleMoveButtonClick(direction: Direction) {
  controlsComponent?.classList.add(CssClass.DISABLED);
  await performMove(direction);
  controlsComponent?.classList.remove(CssClass.DISABLED);
}
