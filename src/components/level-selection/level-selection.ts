import { createButton, createElement } from "../../utils/html-utils";
import styles from "./level-selection.module.scss";
import { levels } from "../../logic/levels";
import { CssClass } from "../../utils/css-class";
import { createDialog, Dialog } from "../../framework/components/dialog/dialog";
import { getLocalStorageItem, LocalStorageKey, setLocalStorageItem } from "../../utils/local-storage";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { deserializeGame } from "../../logic/serializer";

let dialog: Dialog | undefined;

export function openLevelSelection(): void {
  const activeLevelString = getLocalStorageItem(LocalStorageKey.LEVEL) || "0";
  const activeLevel = parseInt(activeLevelString);

  const levelGrid = createElement({ cssClass: styles.levelGrid });
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const levelNumber = i + 1;
    const levelButton = createButton({
      cssClass: [CssClass.SECONDARY, styles.levelButton],
      text: levelNumber.toString(),
      onClick: () => {
        if (dialog) {
          dialog.close(true);
        }

        console.debug("level selected", level);

        pubSubService.publish(PubSubEvent.START_NEW_GAME, {
          isDoOver: false,
          gameSetup: deserializeGame(level.configString, { skipParCalculation: true }),
        });
      },
    });

    if (i > activeLevel) {
      levelButton.disabled = true;
    } else if (i === activeLevel) {
      levelButton.classList.remove(CssClass.SECONDARY);
      levelButton.classList.add(CssClass.PRIMARY);
    }

    levelGrid.append(levelButton);
  }

  dialog = createDialog(levelGrid);
  dialog.submitButton.classList.add(CssClass.OPACITY_HIDDEN);
  dialog.open();
}

export function updateActiveLevel(configString: string): void {
  let activeLevel = levels.findIndex((level) => level.configString === configString);

  if (activeLevel === -1) {
    return;
  }

  activeLevel++;

  setLocalStorageItem(LocalStorageKey.LEVEL, activeLevel.toString());
}
