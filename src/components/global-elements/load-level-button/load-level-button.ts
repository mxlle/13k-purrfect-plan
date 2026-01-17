import { createButton } from "../../../utils/html-utils";
import { CssClass } from "../../../utils/css-class";
import { hasUnknownConfigItems } from "../../../logic/config/config";
import { PubSubEvent, pubSubService } from "../../../utils/pub-sub-service";
import { openLevelSelection } from "../../level-selection/level-selection";

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
    loadLevelButton.classList.toggle(CssClass.OPACITY_HIDDEN, hasUnknownConfigItems());
  }

  pubSubService.subscribe(PubSubEvent.GAME_END, (result) => {
    updateLoadButtonVisibility();
  });

  updateLoadButtonVisibility();

  return loadLevelButton;
}
