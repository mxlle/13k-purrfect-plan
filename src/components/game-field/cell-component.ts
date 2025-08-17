import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { CellType } from "../../logic/data/cell";

const cellTypeToCssClass: Record<Exclude<CellType, CellType.EMPTY>, CssClass> = {
  [CellType.TREE]: CssClass.TREE,
  [CellType.PUDDLE]: CssClass.PUDDLE,
  [CellType.MOON]: CssClass.MOON,
};

export function createCellElement(cell: { type: CellType }): HTMLElement {
  const cellElem = createElement({
    cssClass: CssClass.CELL + " " + (cellTypeToCssClass[cell.type] || ""),
  });

  return cellElem;
}
