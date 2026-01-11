import { createButton } from "../../utils/html-utils";
import { globals } from "../../globals";
import { deserializeGame, serializeGame } from "../../logic/serializer";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";
import { CssClass } from "../../utils/css-class";
import { hasUnknownConfigItems } from "../../logic/config/config";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { StartNewGameOptions } from "../game-area/game-area.component";

export function LoadGameButton(loadGameFn: (options: StartNewGameOptions) => void): HTMLElement {
  const loadGameButton = createButton({
    text: "📂",
    onClick: () => {
      const currentSerializedGame = globals.gameState ? serializeGame(globals.gameState.setup) : "";
      const serializedGameSetup = window.prompt(getTranslation(TranslationKey.SHARE_LOAD_GAME), currentSerializedGame);

      if (serializedGameSetup) {
        const gameSetup = deserializeGame(serializedGameSetup);
        loadGameFn({ gameSetup });
      }
    },
    cssClass: [CssClass.ICON_BTN, CssClass.SECONDARY],
  });

  loadGameButton.style.setProperty("filter", "saturate(0)");

  function updateLoadButtonVisibility() {
    loadGameButton.classList.toggle(CssClass.OPACITY_HIDDEN, hasUnknownConfigItems());
  }

  pubSubService.subscribe(PubSubEvent.GAME_END, (result) => {
    updateLoadButtonVisibility();
  });

  updateLoadButtonVisibility();

  return loadGameButton;
}
