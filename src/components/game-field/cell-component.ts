import { BaseCat, Cell } from "../../types";
import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";

export function createCellElement(_cell: Cell): HTMLElement {
  const cellElem = createElement({
    cssClass: CssClass.CELL,
  });

  return cellElem;
}

export function createCatElement(cat: BaseCat): HTMLElement {
  const catElem = createElement({
    cssClass: `${CssClass.CAT} ${CssClass.CAT_SIZE}${cat.size} ${cat.isMother ? CssClass.IS_MOM : ""}`,
  });

  const catTextElem = createElement({
    tag: "span",
    cssClass: CssClass.EMOJI,
    text: cat.name,
  });

  catElem.append(catTextElem);

  return catElem;
}
