import { createElement } from "../../utils/html-utils";

import styles from "./arrow-component.module.scss";

import arrowIcon from "./arrow-fat.svg";
import { Direction } from "../../types";

export function getArrowComponent(direction: Direction): HTMLElement {

  const arrow = createElement({
    cssClass: `${styles.arrow} ${direction}`,
  });

  arrow.innerHTML = arrowIcon;

  return arrow;
}

export { styles }
