import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { ObjectId } from "../../types";

import styles from "./object-component.module.scss";
import { gameElementClickHandler } from "../../logic/data/game-elements";

export { styles };

export function createObjectElement(objectId: ObjectId): HTMLElement {
  const cellTypeToCssClass: Record<ObjectId, string> = {
    [ObjectId.TREE]: styles.tree,
    [ObjectId.PUDDLE]: styles.puddle,
    [ObjectId.MOON]: styles.moon,
  };

  const objectBox = createElement({
    cssClass: CssClass.OBJECT_BOX,
  });

  const objectElem = createElement({
    cssClass: `${cellTypeToCssClass[objectId]}`,
    onClick: (mouseEvent) => {
      if (import.meta.env.DEV) {
        gameElementClickHandler(objectId);
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
      }
    },
  });

  objectBox.append(objectElem);

  return objectBox;
}
