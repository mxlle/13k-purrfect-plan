import { createElement } from "../../utils/html-utils";
import styles from "./game-area.module.scss";
import { removeAllSpeechBubbles } from "../game-elements/speech-bubble/speech-bubble";
import { GameFieldComponent } from "./game-field/game-field";
import { ComponentDefinition, ConfigItemId, Tool } from "../../types";
import { globals } from "../../globals";
import { CssClass } from "../../utils/css-class";
import { HAS_LOCATION_SERIALIZATION, IS_POKI_ENABLED } from "../../env-utils";
import { handlePokiCommercial } from "../../poki-integration";
import { determineGameSetup, GameSetup, getInitialGameState } from "../../logic/data/game-elements";
import { getInitialGameSetup } from "../../logic/initialize";
import { getControlsAndInfoComponent } from "./controls-and-info/controls-and-info-component";
import { calculateNewPositions } from "../../logic/gameplay/calculate-new-positions";
import { serializeGame } from "../../logic/serializer";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { activateOnboardingHighlight } from "./controls-and-info/controls/controls-component";
import { hasMoreLevels, readableLevel } from "../../logic/levels";
import { DEFAULT_FIELD_SIZE } from "../../logic/data/field-size";
import { LevelDefinition, levels } from "../../logic/level-definition";
import { configItemsWithout, setKnownConfigItems } from "../../logic/config/config";

const TIMEOUT_BETWEEN_GAMES = 300;

export type StartNewGameOptions = { isDoOver?: boolean; isFirstGame?: boolean; gameSetup?: GameSetup };
type BetweenGamesCheckResult = { newConfigItem?: ConfigItemId | boolean; shouldReplaceGameField?: boolean };

export async function GameAreaComponent(): Promise<ComponentDefinition<StartNewGameOptions>> {
  const autoStartGame = hasMoreLevels() || location.hash.length > 1;
  let gameSetup = autoStartGame ? determineGameSetup() : getInitialGameSetup();
  let gameFieldComponent = GameFieldComponent(gameSetup.fieldSize);

  const controlsElem = getControlsAndInfoComponent();

  const hostElement = createElement({ cssClass: styles.host }, [gameFieldComponent.element, controlsElem]);

  hostElement.addEventListener("scroll", () => {
    removeAllSpeechBubbles();
  });

  if (autoStartGame) {
    globals.gameState = getInitialGameState(gameSetup);
  } else {
    void gameFieldComponent.initializeElementsOnGameField({
      gameState: globals.gameState ?? getInitialGameState(gameSetup),
      nextPositionsIfWait: globals.nextPositionsIfWait,
      isInitialStart: true,
    });
  }

  async function startNewGame(options: StartNewGameOptions) {
    let newGameSetup: GameSetup | undefined = options.gameSetup ?? determineGameSetup(options);

    setKnownConfigItems(configItemsWithout(levels[newGameSetup?.levelIndex ?? -1].excludedConfigItems));

    const isBetweenGames = !options.isFirstGame && !options.isDoOver;
    let betweenGamesCheckResult: BetweenGamesCheckResult = {};

    if (isBetweenGames) {
      betweenGamesCheckResult = await betweenGamesCheck(newGameSetup);
    }

    removeAllSpeechBubbles();
    document.body.classList.remove(CssClass.WON);

    const gameSetup = newGameSetup ? newGameSetup : await gameFieldComponent.generateRandomGameWhileAnimating();

    globals.gameState = getInitialGameState(gameSetup);
    globals.failedAttempts = options.isDoOver ? globals.failedAttempts + 1 : 0;
    globals.nextPositionsIfWait = calculateNewPositions(globals.gameState, Tool.WAIT);

    if (HAS_LOCATION_SERIALIZATION) {
      const serializedGameSetup = serializeGame(gameSetup);
      location.hash = gameSetup.levelIndex > -1 ? `#${readableLevel(gameSetup.levelIndex)}` : `#${serializedGameSetup}`;
    }

    document.body.style.setProperty("--s-cnt", gameSetup.fieldSize.toString());

    pubSubService.publish(PubSubEvent.GAME_START);

    if (betweenGamesCheckResult.shouldReplaceGameField) {
      console.debug("Replacing game field for new setup", gameSetup);
      const newGameFieldComponent = GameFieldComponent(gameSetup.fieldSize);
      gameFieldComponent.element.replaceWith(newGameFieldComponent.element);
      gameFieldComponent = newGameFieldComponent;
      await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
    }

    await gameFieldComponent.initializeElementsOnGameField({
      gameState: globals.gameState,
      nextPositionsIfWait: globals.nextPositionsIfWait,
      shouldResetToInitialPosition: !options.isDoOver,
    });

    addOnboardingSuggestionIfApplicable(levels[gameSetup.levelIndex]);
  }

  return [hostElement, startNewGame];
}

async function betweenGamesCheck(newGameSetup: GameSetup | undefined): Promise<BetweenGamesCheckResult> {
  let newConfigItem: ConfigItemId | boolean = false;
  let shouldReplaceGameField = false;

  if (IS_POKI_ENABLED) await handlePokiCommercial();

  const oldGameSetup = globals.gameState?.setup;
  const oldFieldSize = oldGameSetup?.fieldSize ?? DEFAULT_FIELD_SIZE;
  const newFieldSize = newGameSetup?.fieldSize ?? DEFAULT_FIELD_SIZE;

  if (oldFieldSize !== newFieldSize) {
    console.debug("Field size changed from", oldFieldSize, "to", newFieldSize, "replacing game field");
    shouldReplaceGameField = true;
  }

  return { newConfigItem, shouldReplaceGameField };
}

function addOnboardingSuggestionIfApplicable(levelDefinition: LevelDefinition | undefined) {
  if (levelDefinition?.highlightedAction) {
    activateOnboardingHighlight(levelDefinition.highlightedAction);
  }
}
