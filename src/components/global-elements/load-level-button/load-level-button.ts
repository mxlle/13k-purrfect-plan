import { createButton } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";
import { openLevelSelection } from "../../level-selection/level-selection";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { isOnboardingLevel } from "../../../logic/levels";

export function LoadLevelButton(): HTMLElement {
  const loadLevelButton = createButton({
    text: "🔢",
    onClick: () => {
      openLevelSelection();
    },
    cssClass: [CssClass.ICON_BTN, CssClass.SECONDARY],
  });

  loadLevelButton.style.setProperty("filter", "saturate(0)");

  function updateLoadButtonVisibility() {
    loadLevelButton.classList.toggle(CssClass.OPACITY_HIDDEN, isOnboardingLevel());
  }

  pubSubService.subscribe(PubSubEvent.GAME_END, (result) => {
    updateLoadButtonVisibility();
  });

  updateLoadButtonVisibility();

  return loadLevelButton;
}
