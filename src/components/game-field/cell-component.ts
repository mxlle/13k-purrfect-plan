import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

import catSvg from "./black-cat-pink-eyes.svg";
import { BaseCat, isMother } from "../../logic/data/cats";
import { Cell, CellType } from "../../logic/data/cell";

const cellTypeToCssClass: Record<Exclude<CellType, CellType.EMPTY>, CssClass> = {
  [CellType.TREE]: CssClass.TREE,
  [CellType.PUDDLE]: CssClass.PUDDLE,
  [CellType.MOON]: CssClass.MOON,
};

export function createCellElement(cell: Cell): HTMLElement {
  const cellElem = createElement({
    cssClass: CssClass.CELL + " " + (cellTypeToCssClass[cell.type] || ""),
  });

  return cellElem;
}

export function createCatElement(cat: BaseCat): HTMLElement {
  const catBox = createElement({
    cssClass: CssClass.CAT_BOX,
  });

  const catElem = createElement({
    cssClass: `${CssClass.CAT} ${CssClass.CAT_COLOR}${cat.id} ${isMother(cat) ? CssClass.IS_MOM : ""}`,
  });

  catElem.append(catSvg());

  catBox.append(catElem);

  return catBox;
}
