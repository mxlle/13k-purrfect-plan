import { createElement } from "../../../utils/html-utils";
import { changeXP, getCurrentXP, getXpInnerHtml } from "../../../logic/data/experience-points";
import { HAS_VISUAL_NICE_TO_HAVES } from "../../../env-utils";
import { animateNumber } from "../../../utils/custom-animation-util";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";

export function TotalXpInfoComponent(): HTMLElement {
  const xpInfo = createElement();

  function updateXpInfo(xp: number = getCurrentXP()) {
    xpInfo.innerHTML = getXpInnerHtml(xp);
  }

  updateXpInfo();

  function updateXpWithAnimation(newXP: number) {
    const oldXP = getCurrentXP();
    const targetXP = changeXP(newXP);

    if (HAS_VISUAL_NICE_TO_HAVES) {
      animateNumber({
        keyframeDuration: Math.abs(newXP) * 80,
        initialState: oldXP,
        exitState: targetXP,
        onProgress: (current) => {
          updateXpInfo(Math.round(current));
        },
      });
    } else {
      updateXpInfo(targetXP);
    }
  }

  pubSubService.subscribe(PubSubEvent.UPDATE_XP, (newXP) => {
    updateXpWithAnimation(newXP);
  });

  return xpInfo;
}
