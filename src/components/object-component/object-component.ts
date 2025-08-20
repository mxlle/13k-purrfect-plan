import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

import "./object-component.scss";

import { ObjectId } from "../../logic/data/objects";

export function createObjectElement(type: ObjectId): HTMLElement {
  const cellTypeToCssClass: Record<ObjectId, CssClass> = {
    [ObjectId.TREE]: CssClass.TREE,
    [ObjectId.PUDDLE]: CssClass.PUDDLE,
    [ObjectId.MOON]: CssClass.MOON,
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
