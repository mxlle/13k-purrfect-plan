import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

import "./object-component.scss";
import { CellType } from "../../logic/data/cell";

const cellTypeToCssClass: Record<Exclude<CellType, CellType.EMPTY>, CssClass> = {
  [CellType.TREE]: CssClass.TREE,
  [CellType.PUDDLE]: CssClass.PUDDLE,
  [CellType.MOON]: CssClass.MOON,
};

export function createObjectElement(type: CellType): HTMLElement {
  const objectBox = createElement({
    cssClass: CssClass.OBJECT_BOX,
  });

  const objectElem = createElement({
    cssClass: `${cellTypeToCssClass[type]}`,
  });

  objectBox.append(objectElem);

  return objectBox;
}
