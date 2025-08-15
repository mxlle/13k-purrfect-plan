import { createElement } from "../../utils/html-utils";

import "./onboarding-components.scss";

import arrowIcon from "./arrow-fat.svg";
import { CssClass } from "../../utils/css-class";
export const enum Direction {
  UP = CssClass.UP,
  DOWN = CssClass.DOWN,
  LEFT = CssClass.LEFT,
  RIGHT = CssClass.RIGHT,
}

export function getOnboardingArrow(direction: Direction): HTMLElement {
  const arrow = createElement({
    cssClass: `${CssClass.ARROW} ${direction}`,
  });

  arrow.append(arrowIcon());

  return arrow;
}
