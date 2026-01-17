import { CatId, isKittenId, KittenId } from "../../../logic/data/catId";
import { createElement } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";
import catSvg from "./black-cat-pink-eyes-2.svg";

import styles from "./cat-component.module.scss";
import { isCatId, isMom } from "../../../logic/data/cats";
import { sleep } from "../../../utils/promise-utils";
import { hasSoundForAction, playSoundForAction, speak } from "../../../audio/sound-control/sound-control";
import { Direction, Tool } from "../../../types";
import { HAS_KITTEN_MEOWS, HAS_MEOW, HAS_SPOKEN_MEOW } from "../../../env-utils";
import { isConfigItemEnabled } from "../../../logic/config/config";
import { GameElementId, getHtmlElementForGameElement } from "../../../logic/data/game-elements";
import { getArrowComponent, styles as arrowStyles, updateArrowComponent } from "../arrow-component/arrow-component";

export { styles };

const MOM_PLAYBACK_RATE = 1;

const playbackRateMap: Record<CatId, number> = {
  [CatId.MOTHER]: MOM_PLAYBACK_RATE,
  [CatId.MOONY]: MOM_PLAYBACK_RATE * 1.6,
  [CatId.IVY]: MOM_PLAYBACK_RATE * 1.2,
  [CatId.SPLASHY]: MOM_PLAYBACK_RATE * 1.4,
};

const pitchMap: Record<CatId, number> = {
  [CatId.MOTHER]: 1.7,
  [CatId.MOONY]: 2,
  [CatId.IVY]: 1.8,
  [CatId.SPLASHY]: 1.9,
};

export function createCatElement(catId: CatId): HTMLElement {
  return createElement(
    {
      cssClass: CssClass.CAT_BOX,
      ...(HAS_MEOW
        ? {
            onClick: () => {
              void meow(catId);
            },
          }
        : {}),
    },
    [
      createElement({
        cssClass: [styles.cat, isMom(catId) && styles.isMom],
        html: catSvg,
      }),
    ],
  );
}

export function meow(catId: CatId): Promise<void> {
  if (!HAS_MEOW) {
    return Promise.resolve();
  }

  if (HAS_SPOKEN_MEOW) {
    return speak("meow", 0.5, pitchMap[catId]);
  }

  return playSoundForAction(Tool.MEOW, playbackRateMap[catId]);
}

export async function kittenMeows(kittens: KittenId[], doubleMeow?: boolean): Promise<void> {
  if (!HAS_KITTEN_MEOWS) {
    return Promise.resolve();
  }

  if (!hasSoundForAction(Tool.MEOW)) return;

  for (const kitten of kittens) {
    await sleep(50);
    void meow(kitten).then(() => doubleMeow && meow(kitten));
  }
}

export function getCatIdClass(catId: CatId): string {
  return {
    [CatId.MOTHER]: styles.isMom,
    [CatId.MOONY]: styles.moony,
    [CatId.IVY]: styles.ivy,
    [CatId.SPLASHY]: styles.splashy,
  }[catId];
}

export function initializeCatElementStylesIfApplicable(gameElementId: GameElementId): void {
  if (isCatId(gameElementId)) {
    getHtmlElementForGameElement(gameElementId).classList.toggle(
      getCatIdClass(gameElementId),
      !isKittenId(gameElementId) || isConfigItemEnabled(gameElementId),
    );
  }
}

export function updateKittenArrow(kittenId: KittenId, nextDirection: Direction | undefined): void {
  const gameElementNode = getHtmlElementForGameElement(kittenId);
  const existingArrow = gameElementNode.querySelector(`.${arrowStyles.arrow}`) as HTMLElement | undefined;

  if (nextDirection) {
    if (existingArrow) {
      updateArrowComponent(existingArrow, nextDirection);
    } else {
      gameElementNode.append(getArrowComponent(nextDirection));
    }
  } else {
    existingArrow?.remove();
  }
}
