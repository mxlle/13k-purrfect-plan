import { createElement } from "../../../utils/html-utils";
import styles from "./header.module.scss";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { getCurrentLevelIndexFromLocation } from "../../../components/level-selection/level-selection";
import { levels } from "../../../logic/levels";

export function HeaderComponent(title: string, endElements: (Node | string)[] = []): HTMLElement {
  const hostElement = createElement({ cssClass: styles.host }, [
    createElement({ cssClass: styles.title }, [title]),
    createElement({ cssClass: styles.endElements }, endElements),
  ]);

  pubSubService.subscribe(PubSubEvent.START_NEW_GAME, () => {
    hostElement.children[0].textContent = title;
  });

  pubSubService.subscribe(PubSubEvent.GAME_START, () => {
    const currentLevelIndex = getCurrentLevelIndexFromLocation();
    const currentLevelDefinition = levels[currentLevelIndex];
    const extraText = currentLevelDefinition ? ` #${currentLevelIndex + 1}` : "";
    hostElement.children[0].textContent = `${title}${extraText}`;
  });

  return hostElement;
}
