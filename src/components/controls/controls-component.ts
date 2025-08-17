import { createButton, createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { Direction, Tool, TurnMove } from "../../types";

import "./controls-component.scss";
import { performMove } from "../../logic/game-logic";
import { getArrowComponent } from "../arrow-component/arrow-component";
import {
  ActiveRecording,
  hasSoundForAction,
  requestMicrophoneAccess,
  saveRecording,
  startRecording,
} from "../../audio/sound-control/sound-control";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { addStartButton } from "../game-field/game-field";
import { TranslationKey } from "../../translations/i18n";

let hasSetupEventListeners = false;
let controlsComponent: HTMLElement | undefined;
let activeRecording: ActiveRecording | undefined;

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
  // movementContainer.appendChild(createRecordButton([Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT]));

  controlsComponent.appendChild(movementContainer);

  const toolContainer = createElement({
    cssClass: CssClass.TOOL_CONTROLS,
  });

  const meowButton = createButton({
    text: "Meow",
    onClick: () => performMove(Tool.MEOW),
  });

  toolContainer.appendChild(createRecordButton([Tool.MEOW]));
  toolContainer.appendChild(meowButton);
  controlsComponent.appendChild(toolContainer);

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
    onClick: () => handleMoveButtonClick(direction),
    iconBtn: true,
  });

  const arrow = getArrowComponent(direction, false);
  button.append(arrow);

  return button;
}

function setupEventListeners() {
  if (hasSetupEventListeners) return;

  pubSubService.subscribe(PubSubEvent.GAME_END, () => {
    if (!controlsComponent) return;

    addStartButton(TranslationKey.NEW_GAME, controlsComponent);
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
      void performMove(turnMove);
    }
  });

  hasSetupEventListeners = true;
}

async function handleMoveButtonClick(direction: Direction) {
  await performMove(direction);
}
