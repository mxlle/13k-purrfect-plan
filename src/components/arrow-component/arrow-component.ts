import { createElement } from "../../utils/html-utils";

import styles from "./arrow-component.module.scss";

import arrowIcon from "./arrow-fat.svg";
import { Direction } from "../../types";

export const cssClassByDirection: Record<Direction, string> = {
  [Direction.UP]: styles.up,
  [Direction.DOWN]: styles.down,
  [Direction.LEFT]: styles.left,
  [Direction.RIGHT]: styles.right,
};

export function getArrowComponent(direction: Direction): HTMLElement {
  const arrow = createElement({
    cssClass: `${styles.arrow} ${cssClassByDirection[direction]}`,
  });

  arrow.innerHTML = arrowIcon;

  return arrow;
}

export { styles };
