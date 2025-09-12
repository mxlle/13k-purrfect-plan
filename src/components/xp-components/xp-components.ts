import { createElement, resetTransform } from "../../utils/html-utils";
import { XP_REP } from "../../logic/data/experience-points";
import { requestAnimationFrameWithTimeout, sleep } from "../../utils/promise-utils";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { CssClass } from "../../utils/css-class";
import styles from "./xp-components.module.scss";

export async function collectXp(source: HTMLElement, newXp: number) {
  sleep(500).then(() => {
    pubSubService.publish(PubSubEvent.UPDATE_XP, newXp);
  });
  await flyMultipleXpAway(newXp, source);
}

async function flyMultipleXpAway(xp: number, source: HTMLElement) {
  const delay = 500 / xp;
  for (let i = 0; i < xp; i++) {
    const mod = i / xp;
    const xMod = 0.5 + (i % 2 === 0 ? -1 : 1) * mod * 0.3;
    const hueRotate = mod * 360;
    void animateXpFlyAway(XP_REP, source, xMod, hueRotate);

    await requestAnimationFrameWithTimeout(delay);
  }
}

export async function animateXpFlyAway(html: string, source: HTMLElement, xMod: number = 0.5, hueRotate: number = 0) {
  // console.debug("animateXpFlyAway", { html, xMod });
  const flyAwayElement = createElement({ html, cssClass: styles.flyAwayElement });
  const sourceRect = source.getBoundingClientRect();
  const diffXFromTopRight = sourceRect.right - document.body.clientWidth;
  const diffYFromTopRight = sourceRect.top - sourceRect.height / 2;
  const additionalOffset = sourceRect.width * xMod * -1;

  flyAwayElement.style.setProperty(
    "transform",
    `translate(calc(50% + ${diffXFromTopRight + additionalOffset}px), calc(50% + ${diffYFromTopRight}px)) scale(2)`,
  );
  flyAwayElement.style.setProperty("filter", `hue-rotate(${hueRotate}deg)`);
  document.body.append(flyAwayElement);

  await requestAnimationFrameWithTimeout(0);

  flyAwayElement.classList.add(CssClass.OPACITY_HIDDEN);

  resetTransform(flyAwayElement);

  await sleep(500);

  sleep(500).then(() => {
    flyAwayElement.remove();
  });
}
