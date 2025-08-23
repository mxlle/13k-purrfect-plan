import { createElement } from "../../utils/html-utils";

import styles from "./config-component.module.scss";
import { getCatElement } from "../../logic/data/cats";
import { ALL_KITTEN_IDS } from "../../logic/data/catId";
import { globals } from "../../globals";
import { createObjectElement } from "../object-component/object-component";
import { allCategories, ConfigCategory, ConfigItemId } from "../../logic/config";
import { ObjectId } from "../../logic/data/objects";
let configComponent: HTMLElement | undefined;

export function getConfigComponent(): HTMLElement {
  configComponent = createElement({
    cssClass: styles.config,
  });

  for (const category of allCategories) {
    const categoryElem = getConfigCategoryElement(category);
    configComponent.appendChild(categoryElem);
  }

  return configComponent;
}

function getConfigCategoryElement(category: ConfigCategory): HTMLElement {
  const categoryElem = createElement({
    cssClass: styles.configCategory,
  });

  const titleElem = createElement({
    text: category,
  });

  categoryElem.appendChild(titleElem);

  const contentElem = createElement();

  switch (category) {
    case ConfigCategory.CATS:
      for (const kittenId of ALL_KITTEN_IDS) {
        const catElem = getCatElement(kittenId).cloneNode(true);
        transformToConfigItemElement(category, kittenId, catElem as HTMLElement);
        contentElem.appendChild(catElem);
      }
      break;
    case ConfigCategory.OBJECTS:
      const allObjects = Object.values(ObjectId).filter(Boolean);
      for (const objectType of allObjects) {
        const objectElem = createObjectElement(objectType);
        transformToConfigItemElement(category, objectType, objectElem as HTMLElement);
        contentElem.appendChild(objectElem);
      }
      break;
    case ConfigCategory.TOOLS:
      break;
  }

  categoryElem.appendChild(contentElem);

  return categoryElem;
}

function transformToConfigItemElement(category: ConfigCategory, id: ConfigItemId, itemElement: HTMLElement) {
  if (globals.gameState.setup.config[category][id]) {
    itemElement.classList.add(styles.selected);
  }

  itemElement.onclick = () => {
    const newValue = !globals.gameState.setup.config[category][id];
    globals.gameState.setup.config[category][id] = newValue;
    itemElement.classList.toggle(styles.selected, newValue);
  };
}
