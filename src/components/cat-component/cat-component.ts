import { CatId, KittenId } from "../../logic/data/catId";
import { createElement } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import catSvg from "./black-cat-pink-eyes-2.svg";

import styles from "./cat-component.module.scss";
import { isMom } from "../../logic/data/cats";
import { sleep } from "../../utils/promise-utils";
import { hasSoundForAction, playSoundForAction, speak } from "../../audio/sound-control/sound-control";
import { Tool } from "../../types";
import { HAS_SIMPLE_SOUND_EFFECTS, HAS_SOUND_EFFECTS } from "../../env-utils";

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
      ...(HAS_SOUND_EFFECTS || HAS_SIMPLE_SOUND_EFFECTS
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
  if (HAS_SIMPLE_SOUND_EFFECTS) {
    return speak("meow", 0.5, pitchMap[catId]);
  }

  if (!HAS_SOUND_EFFECTS) {
    return Promise.resolve();
  }

  return playSoundForAction(Tool.MEOW, playbackRateMap[catId]);
}

export async function kittenMeows(kittens: KittenId[], doubleMeow?: boolean): Promise<void> {
  if (!HAS_SOUND_EFFECTS) {
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
