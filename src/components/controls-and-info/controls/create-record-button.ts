import {
  ActiveRecording,
  hasSoundForAction,
  requestMicrophoneAccess,
  saveRecording,
  startRecording,
} from "../../../audio/sound-control/sound-control";
import { TurnMove } from "../../../types";
import { createButton } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";

let activeRecording: ActiveRecording | undefined;

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
