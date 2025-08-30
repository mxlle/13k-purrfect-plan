import { createButton, createElement } from "../../utils/html-utils";

import styles from "./config-component.module.scss";
import { getCatElement, isCatId } from "../../logic/data/cats";
import { ALL_KITTEN_IDS, CatId } from "../../logic/data/catId";
import { createObjectElement } from "../object-component/object-component";
import { allCategories, allInConfig, copyConfig } from "../../logic/config/config";
import { ALL_OBJECT_IDS } from "../../logic/data/objects";
import { getCatIdClass, meow } from "../cat-component/cat-component";
import { ConfigCategory, ConfigItemId, Tool } from "../../types";
import { MoveLimit } from "../../logic/config/move-limit";
import { globals } from "../../globals";
import { copyGameSetup, GameSetup, GameState } from "../../logic/data/game-elements";
import { generateRandomGameWhileAnimating, refreshFieldWithSetup } from "../game-field/game-field";
import { calculatePar } from "../../logic/par";

let configComponent: HTMLElement | undefined;
let configObject = copyConfig({ ...allInConfig });

export function getConfigComponent(): HTMLElement {
  configComponent = createElement({
    cssClass: styles.config,
  });

  for (const category of allCategories) {
    if (category === ConfigCategory.OBJECTS) continue;
    const categoryElem = getConfigCategoryElement(category);
    configComponent.appendChild(categoryElem);
  }

  const btns = createElement({ cssClass: styles.btnContainer });

  btns.append(
    createButton({
      text: "Check possible solutions",
      onClick: checkPossibleSolutions,
    }),
  );

  btns.append(
    createButton({
      text: "Reshuffle field",
      onClick: reshuffleField,
    }),
  );

  const btnsTitleElem = createElement({
    text: "Solutions / Positions",
  });

  configComponent.appendChild(btnsTitleElem);

  configComponent.appendChild(btns);

  return configComponent;
}

function getNewSetupWithConfig(gameState: GameState): GameSetup {
  const newSetup = copyGameSetup(gameState.setup);
  newSetup.config = copyConfig(configObject);
  return newSetup;
}

function refreshField() {
  if (globals.gameState) {
    void refreshFieldWithSetup(getNewSetupWithConfig(globals.gameState), undefined, true, false);
  }
}

function checkPossibleSolutions() {
  if (globals.gameState) {
    const newSetup = getNewSetupWithConfig(globals.gameState);
    const parInfo = calculatePar(newSetup);
    newSetup.possibleSolutions = parInfo.possibleSolutions;
    void refreshFieldWithSetup(newSetup, undefined, false, false);
  }
}

async function reshuffleField() {
  const newSetup = await generateRandomGameWhileAnimating(configObject);
  void refreshFieldWithSetup(newSetup, undefined, false, true);
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
    case ConfigCategory.KITTEN_BEHAVIOR:
      for (const kittenId of ALL_KITTEN_IDS) {
        const catElem = getCatElement(kittenId).cloneNode(true);
        // catElem.appendChild(getArrowComponent(Direction.UP));
        transformToConfigItemElement(category, kittenId, catElem as HTMLElement);
        contentElem.appendChild(catElem);
      }
      break;
    case ConfigCategory.OBJECTS:
      for (const objectType of ALL_OBJECT_IDS) {
        const objectElem = createObjectElement(objectType);
        transformToConfigItemElement(category, objectType, objectElem as HTMLElement);
        contentElem.appendChild(objectElem);
      }
      break;
    case ConfigCategory.TOOLS:
      for (const tool of Object.values(Tool)) {
        const toolElem = createElement({ text: "Meow" });
        transformToConfigItemElement(category, tool, toolElem);
        contentElem.appendChild(toolElem);
      }
      break;
    case ConfigCategory.CONSTRAINTS:
      for (const constraint of Object.values(MoveLimit)) {
        const constraintElem = createElement({ text: constraint });
        transformToConfigItemElement(category, constraint, constraintElem);
        contentElem.appendChild(constraintElem);
      }
      break;
  }

  categoryElem.appendChild(contentElem);

  return categoryElem;
}

function transformToConfigItemElement(category: ConfigCategory, id: ConfigItemId, itemElement: HTMLElement) {
  itemElement.classList.add(styles.configItem);

  if (configObject[category][id]) {
    itemElement.classList.add(styles.selected);

    if (isCatId(id)) {
      itemElement.classList.add(getCatIdClass(id));
    }
  }

  itemElement.onclick = () => {
    const newValue = !configObject[category][id];
    configObject[category][id] = newValue;
    itemElement.classList.toggle(isCatId(id) ? getCatIdClass(id) : styles.selected, newValue);

    if (id === Tool.MEOW && newValue) {
      void meow(CatId.MOTHER);
    }

    if (isCatId(id)) {
      refreshField();
    }
  };
}
