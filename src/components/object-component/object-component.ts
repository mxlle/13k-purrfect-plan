import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

import styles from "./object-component.module.scss";

import { ObjectId } from "../../logic/data/objects";

export { styles }

export function createObjectElement(type: ObjectId): HTMLElement {
  const cellTypeToCssClass: Record<ObjectId, string> = {
    [ObjectId.TREE]: styles.tree,
    [ObjectId.PUDDLE]: styles.puddle,
    [ObjectId.MOON]: styles.moon,
  };

  const objectBox = createElement({
    cssClass: CssClass.OBJECT_BOX,
  });

  const objectElem = createElement({
    cssClass: `${cellTypeToCssClass[type]}`,
  });

  objectBox.append(objectElem);

  return objectBox;
}
