import { ActiveRecording, hasSoundForAction, saveRecording, startRecording } from "../../audio/sound-control/sound-control";
import { Tool, TurnMove } from "../../types";
import { createButton } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { HAS_GAMEPLAY_NICE_TO_HAVES } from "../../env-utils";
import { sleep } from "../../utils/promise-utils";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { playOrPauseMusicIfApplicable } from "../../audio/music-control";
import styles from "./controls-and-info-component.module.scss";

let activeRecording: ActiveRecording | undefined;

export function createRecordButton(actions: TurnMove[]): HTMLElement {
  const recordButton = createButton({
    cssClass: [CssClass.SECONDARY, styles.recordBtn],
    onClick: () => void toggleRecordSoundEffect(recordButton, actions),
  });

  updateRecordButtonLabel(recordButton);

  return recordButton;
}

function updateRecordButtonLabel(btn: HTMLButtonElement) {
  btn.textContent = hasSoundForAction(Tool.MEOW)
    ? `🗑️ ${getTranslation(TranslationKey.DELETE_RECORD)}`
    : `🎤 ${getTranslation(TranslationKey.RECORD)}`;
}

async function toggleRecordSoundEffect(btn: HTMLButtonElement, actions: TurnMove[]) {
  // const ok = await requestMicrophoneAccess();
  if (hasSoundForAction(Tool.MEOW)) {
    saveRecording(Tool.MEOW, "");
    updateRecordButtonLabel(btn);
    return;
  }

  if (activeRecording) {
    return;
  }

  try {
    playOrPauseMusicIfApplicable(false);
    activeRecording = await startRecording();
    activeRecording.done.then((recording) => {
      if (recording) {
        for (const action of actions) {
          saveRecording(action, recording);
          updateRecordButtonLabel(btn);
        }
      }
    });
    btn.classList.add(CssClass.PRIMARY);

    await sleep(1000);
    activeRecording?.stop();
  } catch (error) {
    console.error("Error starting recording:", error);
    HAS_GAMEPLAY_NICE_TO_HAVES && alert(error instanceof Error ? error.message : "unknown error");
  } finally {
    btn.classList.remove(CssClass.PRIMARY);
    activeRecording = undefined;
    playOrPauseMusicIfApplicable();
  }
}
