import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

import catSvg from "./black-cat-pink-eyes.svg";
import { BaseCat, isMother } from "../../logic/data/cats";
import { Cell } from "../../logic/data/cell";

export function createCellElement(_cell: Cell): HTMLElement {
  const cellElem = createElement({
    cssClass: CssClass.CELL,
  });

  return cellElem;
}

export function createCatElement(cat: BaseCat): HTMLElement {
  const catElem = createElement({
    cssClass: `${CssClass.CAT} ${CssClass.CAT_COLOR}${cat.id} ${isMother(cat) ? CssClass.IS_MOM : ""}`,
  });

  catElem.append(catSvg());

  return catElem;
}
