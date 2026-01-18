import { createButton, createElement } from "../../utils/html-utils";
import styles from "./level-selection.module.scss";
import { CssClass } from "../../utils/css-class";
import { createDialog, Dialog } from "../../framework/components/dialog/dialog";
import { getLocalStorageItem, LocalStorageKey } from "../../utils/local-storage";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { deserializeGame } from "../../logic/serializer";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { levels } from "../../logic/level-definition";

let dialog: Dialog | undefined;

export function openLevelSelection(onClose: (isSubmit: boolean) => void = () => {}): void {
  const activeLevelString = getLocalStorageItem(LocalStorageKey.LEVEL) || "0";
  const activeLevel = parseInt(activeLevelString);
  let hasHighlightedLevel = false;

  const levelGrid = createElement({ cssClass: styles.levelGrid });
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const levelNumber = i + 1;
    const levelButton = createButton({
      cssClass: [CssClass.SECONDARY, styles.levelButton],
      text: levelNumber.toString(),
      onClick: () => {
        dialog?.close(true);

        console.debug("level selected", level);

        pubSubService.publish(PubSubEvent.START_NEW_GAME, {
          isDoOver: false,
          gameSetup: deserializeGame(level.configString),
        });
      },
    });

    if (i > activeLevel) {
      levelButton.disabled = true;
    } else if (i === activeLevel) {
      levelButton.classList.remove(CssClass.SECONDARY);
      levelButton.classList.add(CssClass.PRIMARY);
      hasHighlightedLevel = true;
    }

    levelGrid.append(levelButton);
  }

  levelGrid.append(
    createButton({
      cssClass: [styles.randomGameButton, hasHighlightedLevel ? CssClass.SECONDARY : CssClass.PRIMARY],
      text: getTranslation(TranslationKey.RANDOM_GAME),
      onClick: () => {
        dialog?.close(true);
        pubSubService.publish(PubSubEvent.START_NEW_GAME, { isDoOver: false });
      },
    }),
  );

  dialog = createDialog(levelGrid, onClose);
  dialog.submitButton.innerText = getTranslation(TranslationKey.CANCEL);
  dialog.submitButton.classList.remove(CssClass.PRIMARY);
  dialog.open();
}
