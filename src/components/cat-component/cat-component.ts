import { CatId } from "../../logic/data/catId";
import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import catSvg from "./black-cat-pink-eyes.svg";

import styles from "./cat-component.module.scss";
export { styles }

export function createCatElement(catId: CatId): HTMLElement {
  const catBox = createElement({
    cssClass: CssClass.CAT_BOX,
  });

  const catIdClass = {
    [CatId.MOTHER]: styles.isMom,
    [CatId.MOONY]: styles.moony,
    [CatId.IVY]: styles.ivy,
    [CatId.SPLASHY]: styles.splashy,
  }[catId];

  const catElem = createElement({
    cssClass: `${styles.cat} ${catIdClass}`,
  });

  catElem.innerHTML = catSvg;

  catBox.append(catElem);

  return catBox;
}
