import { CatId, KittenId } from "../../logic/data/catId";
import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import catSvg from "./black-cat-pink-eyes.svg";

import styles from "./cat-component.module.scss";
import { isMom } from "../../logic/data/cats";
import { hasSoundForAction, playSoundForAction } from "../../audio/sound-control/sound-control";
import { Tool } from "../../types";
import { sleep } from "../../utils/promise-utils";

export { styles };

const MOM_PLAYBACK_RATE = 1.2;

const playbackRateMap: Record<CatId, number> = {
  [CatId.MOTHER]: MOM_PLAYBACK_RATE,
  [CatId.MOONY]: MOM_PLAYBACK_RATE * 1.6,
  [CatId.IVY]: MOM_PLAYBACK_RATE * 1.2,
  [CatId.SPLASHY]: MOM_PLAYBACK_RATE * 1.4,
};

export function createCatElement(catId: CatId): HTMLElement {
  return createElement(
    {
      cssClass: CssClass.CAT_BOX,
      onClick: () => {
        void meow(catId);
      },
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
  if (!import.meta.env.DEV) {
    return Promise.resolve();
  }

  return playSoundForAction(Tool.MEOW, playbackRateMap[catId]);
}

export async function kittenMeows(kittens: KittenId[], doubleMeow?: boolean): Promise<void> {
  if (!import.meta.env.DEV) {
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
