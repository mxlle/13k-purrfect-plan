import { CatId, isMom } from "../../logic/data/cats";
import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import catSvg from "./black-cat-pink-eyes.svg";

import "./cat-component.scss";

export function createCatElement(catId: CatId): HTMLElement {
  const catBox = createElement({
    cssClass: CssClass.CAT_BOX,
  });

  const catElem = createElement({
    cssClass: `${CssClass.CAT} ${isMom(catId) ? CssClass.IS_MOM : ""}`,
  });

  catElem.append(catSvg());

  catBox.append(catElem);

  return catBox;
}
