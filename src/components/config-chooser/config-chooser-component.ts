import { createDialog, Dialog } from "../dialog/dialog";
import { createButton, createElement, resetTransform } from "../../utils/html-utils";
import { allConfigItems, explanationMap, getNextUnknownConfigItems, getToolText, updateKnownConfigItems } from "../../logic/config/config";
import { shuffleArray } from "../../utils/random-utils";
import { getCatElement, isCatId } from "../../logic/data/cats";
import { ConfigItemId, isTool } from "../../types";

import styles from "./config-chooser-component.module.scss";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { getCatIdClass } from "../cat-component/cat-component";
import { sleep } from "../../utils/promise-utils";
import { CssClass } from "../../utils/css-class";

let chooserDialog: Dialog | undefined;

export async function createConfigChooserComponent(): Promise<ConfigItemId | boolean> {
  let selectedConfigItem: ConfigItemId | true | undefined;

  const chooserContainer = createElement({ cssClass: styles.container });
  const header = createElement({ text: getTranslation(TranslationKey.CHOOSER_TITLE) });
  chooserContainer.append(header);

  const explanationElement = createElement({ cssClass: styles.explanation, text: getTranslation(TranslationKey.EXPLANATION_EMPTY) });
  const skipTutorialButton = createButton({
    text: getTranslation(TranslationKey.SKIP_TUTORIAL),
    cssClass: CssClass.TERTIARY,
    onClick: () => {
      selectedConfigItem = true;
      chooserDialog?.close(true);
    },
  });

  const choicesContainer = createElement({ cssClass: styles.choices });
  const choices = getNextChoice();
  const choiceElements = choices.map((choice, index) => {
    function chooseItem(event: MouseEvent) {
      if (selectedConfigItem) {
        return;
      }

      skipTutorialButton.remove();
      explanationElement.innerHTML = getTranslation(explanationMap[choice]);
      explanationElement.classList.add(styles.active);
      header.innerHTML = getTranslation(TranslationKey.YOUR_CHOICE);
      selectedConfigItem = choice;
      chooserDialog && chooserDialog.submitButton.classList.remove(CssClass.OPACITY_HIDDEN);

      const chosenElement = event.target as HTMLElement;
      const otherSibling = (index === 0 ? choicesContainer.lastElementChild : choicesContainer.firstElementChild) as HTMLElement;

      // transform chosen to middle and fade out other
      if (choices.length === 2) {
        chosenElement.style.setProperty("--t-x", index === 0 ? "calc(50% + 1rem)" : "calc(-50% - 1rem)");
        otherSibling.classList.add(CssClass.OPACITY_HIDDEN);
      }

      chosenElement.classList.add(styles.selected);
    }

    return getChoiceElement(choice, chooseItem);
  });

  choicesContainer.append(...choiceElements);
  chooserContainer.append(choicesContainer, explanationElement, skipTutorialButton);

  chooserDialog = createDialog(chooserContainer);
  chooserDialog.submitButton.classList.add(CssClass.OPACITY_HIDDEN);

  return chooserDialog.open().then((isConfirmed): ConfigItemId | boolean => {
    if (isConfirmed && selectedConfigItem) {
      if (selectedConfigItem === true) {
        updateKnownConfigItems(allConfigItems);
      } else {
        updateKnownConfigItems([selectedConfigItem]);
      }
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
  const translationKey = isCatId(configItem)
    ? TranslationKey.CHOICE_KITTEN_BEHAVIOR
    : isTool(configItem)
      ? TranslationKey.CHOICE_TOOL
      : TranslationKey.CHOICE_RULE;
  let innerChild: HTMLElement | undefined;

  if (isCatId(configItem)) {
    innerChild = getCatElement(configItem).cloneNode(true) as HTMLElement;
    resetTransform(innerChild);
  }

  const configItemElement = createButton({
    cssClass: styles.configItem,
    text: getTranslation(translationKey),
    onClick: (event) => {
      if (isCatId(configItem)) {
        innerChild.classList.add(getCatIdClass(configItem));
      } else {
        event.target.innerHTML = isTool(configItem) ? getToolText(configItem) : configItem;
      }

      chooseItem(event);
    },
  });

  if (innerChild) {
    configItemElement.append(innerChild);
  }

  return configItemElement;
}
