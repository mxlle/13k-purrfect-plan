import { createElement } from "../../utils/html-utils";

import "./arrow-component.scss";

import arrowIcon from "./arrow-fat.svg";
import { CssClass } from "../../utils/css-class";
import { Direction } from "../../types";

export function getArrowComponent(direction: Direction, shouldAnimate: boolean): HTMLElement {
  const arrow = createElement({
    cssClass: `${CssClass.ARROW} ${direction} ${shouldAnimate && CssClass.ANIMATED}`,
  });

  arrow.append(arrowIcon());

  return arrow;
}
