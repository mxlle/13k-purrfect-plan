import { createDialog, Dialog } from "../dialog/dialog";
import { createElement } from "../../utils/html-utils";
import { explanationMap, getNextUnknownConfigItems, updateKnownConfigItems } from "../../logic/config/config";
import { shuffleArray } from "../../utils/random-utils";
import { getCatElement, isCatId } from "../../logic/data/cats";
import { ConfigItemId, isTool } from "../../types";
import { isMoveLimit } from "../../logic/config/move-limit";

import styles from "./config-chooser-component.module.scss";
import configStyles from "../config/config-component.module.scss";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { getCatIdClass } from "../cat-component/cat-component";
import { sleep } from "../../utils/promise-utils";

let chooserDialog: Dialog | undefined;

export async function createConfigChooserComponent(): Promise<ConfigItemId | false> {
  let selectedConfigItem: ConfigItemId | undefined;

  const chooserContainer = createElement({ cssClass: styles.container });
  const header = createElement({ text: getTranslation(TranslationKey.CHOOSER_TITLE) });
  chooserContainer.append(header);

  const explanationElement = createElement({ cssClass: styles.explanation, text: getTranslation(TranslationKey.EXPLANATION_EMPTY) });

  const choicesContainer = createElement({ cssClass: styles.choices });
  const choices = getNextChoice();
  const choiceElements = choices.map((choice, index) => {
    function chooseItem(event: MouseEvent) {
      explanationElement.innerHTML = getTranslation(explanationMap[choice]);
      explanationElement.classList.add(styles.active);
      header.innerHTML = getTranslation(TranslationKey.YOUR_CHOICE);
      selectedConfigItem = choice;
      chooserDialog?.toggleSubmitDisabled(false);

      const chosenElement = event.target as HTMLElement;
      const otherSibling = (index === 0 ? choicesContainer.lastElementChild : choicesContainer.firstElementChild) as HTMLElement;

      // transform chosen to middle and fade out other
      if (choices.length === 2) {
        chosenElement.style.transform =
          index === 0 ? "translateX(calc(50% + 1rem)) scale(1.2)" : "translateX(calc(-50% - 1rem)) scale(1.2)";
        otherSibling.style.opacity = "0";
      } else {
        chosenElement.style.transform = "scale(1.2)";
      }
    }

    return getChoiceElement(choice, chooseItem);
  });
  choiceElements.forEach((choiceElement) => {
    choiceElement.classList.add(configStyles.configItem, configStyles.chooser);
    choicesContainer.append(choiceElement);
  });

  chooserContainer.append(choicesContainer);
  chooserContainer.append(explanationElement);

  chooserDialog = createDialog(chooserContainer, { submitButtonText: getTranslation(TranslationKey.CONFIRM), showCloseButton: false });
  chooserDialog.toggleSubmitDisabled(true);

  return chooserDialog.open().then((isConfirmed): ConfigItemId | false => {
    if (isConfirmed && selectedConfigItem) {
      updateKnownConfigItems([selectedConfigItem]);
    }

    sleep(600).then(() => chooserDialog?.destroy());

    return isConfirmed ? selectedConfigItem || false : false;
  });
}

function getNextChoice() {
  const unknownConfigItems = getNextUnknownConfigItems();
  shuffleArray(unknownConfigItems);

  return unknownConfigItems.slice(0, 2);
}

function getChoiceElement(configItem: ConfigItemId, chooseItem: (event: MouseEvent) => void): HTMLElement {
  if (isCatId(configItem)) {
    const catElem = getCatElement(configItem).cloneNode(true) as HTMLElement;
    catElem.style.transform = "none";
    const catContainer = createElement({
      text: getTranslation(TranslationKey.CHOICE_KITTEN_BEHAVIOR),
      onClick: (event) => {
        catElem.classList.add(getCatIdClass(configItem));
        chooseItem(event);
      },
    });
    catContainer.append(catElem);

    return catContainer;
  }

  if (isTool(configItem)) {
    return createElement({
      text: getTranslation(TranslationKey.CHOICE_TOOL),
      onClick: (event) => {
        event.target.innerHTML = getTranslation(TranslationKey.MEOW);
        chooseItem(event);
      },
    });
  }

  if (isMoveLimit(configItem)) {
    return createElement({
      text: getTranslation(TranslationKey.CHOICE_RULE),
      onClick: (event) => {
        event.target.innerHTML = configItem;
        chooseItem(event);
      },
    });
  }
}
