import { createButton } from "../../utils/html-utils";
import { CssClass } from "../../utils/css-class";
import { togglePlayer } from "../../audio/music-control";
import { getLocalStorageItem, LocalStorageKey } from "../../utils/local-storage";

const initializeMuted = getLocalStorageItem(LocalStorageKey.MUTED) === "true";

export function MuteButton(): HTMLElement {
  const muteButton = createButton({
    text: initializeMuted ? "🔇" : "🔊",
    onClick: (event: MouseEvent) => {
      const isActive = togglePlayer();
      (event.target as HTMLElement).textContent = isActive ? "🔊" : "🔇";
    },
    cssClass: [CssClass.ICON_BTN, CssClass.SECONDARY],
  });

  return muteButton;
}
