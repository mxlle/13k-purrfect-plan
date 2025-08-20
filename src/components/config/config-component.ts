import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

import "./config-component.scss";
import { ALL_CAT_IDS, getCat, isMother } from "../../logic/data/cats";
import { globals } from "../../globals";
import { createObjectElement } from "../object-component/object-component";
import { allCategories, ConfigCategory, ConfigItemId } from "../../logic/config";
import { ObjectId } from "../../logic/data/objects";

let configComponent: HTMLElement | undefined;

export function getConfigComponent(): HTMLElement {
  configComponent = createElement({
    cssClass: CssClass.CONFIG,
  });

  for (const category of allCategories) {
    const categoryElem = getConfigCategoryElement(category);
    configComponent.appendChild(categoryElem);
  }

  return configComponent;
}

function getConfigCategoryElement(category: ConfigCategory): HTMLElement {
  const categoryElem = createElement({
    cssClass: CssClass.CONFIG_CATEGORY,
  });

  const titleElem = createElement({
    text: category,
  });

  categoryElem.appendChild(titleElem);

  const contentElem = createElement();

  switch (category) {
    case ConfigCategory.CATS:
      const allCats = ALL_CAT_IDS.map(getCat).filter((cat) => !isMother(cat));
      for (const cat of allCats) {
        const catElem = cat.catElement.cloneNode(true);
        transformToConfigItemElement(category, cat.id, catElem as HTMLElement);
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
  if (globals.config[category][id]) {
    itemElement.classList.add(CssClass.SELECTED);
  }

  itemElement.onclick = () => {
    const newValue = !globals.config[category][id];
    globals.config[category][id] = newValue;
    itemElement.classList.toggle(CssClass.SELECTED, newValue);
  };
}
