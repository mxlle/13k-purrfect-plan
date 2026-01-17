import styles from "./star-background.module.scss";
import { createElement } from "../../utils/html-utils";
import { getRandomIntFromInterval } from "../../utils/random-utils";

export function StarBackground() {
  const pixelCount = window.innerHeight * window.innerWidth;
  const starCount = Math.round(pixelCount / 10000);

  console.debug(`Pixel count: ${pixelCount}, star count: ${starCount}`);

  const backgroundElem = createElement({ cssClass: styles.sky });

  for (let i = 0; i < starCount; i++) {
    const starElem = createElement({ cssClass: styles.star });
    const x = getRandomIntFromInterval(1, 99);
    const y = getRandomIntFromInterval(1, 99);
    starElem.style.left = `${x}%`;
    starElem.style.top = `${y}%`;
    backgroundElem.append(starElem);
  }

  return backgroundElem;
}
