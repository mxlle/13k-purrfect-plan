import { BaseCat, isMother } from "../../logic/data/cats";
import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import catSvg from "./black-cat-pink-eyes.svg";

import "./cat-component.scss";

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
