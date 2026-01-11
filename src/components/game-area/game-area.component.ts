import { createElement } from "../../utils/html-utils";
import styles from "./game-area.module.scss";
import { removeAllSpeechBubbles } from "../speech-bubble/speech-bubble";
import {
  getOnboardingData,
  increaseOnboardingStepIfApplicable,
  isOnboarding,
  isSameLevel,
  OnboardingData,
  wasLastOnboardingStep,
} from "../../logic/onboarding";
import { GameFieldComponent, generateRandomGameWhileAnimating, initializeElementsOnGameField } from "../game-field/game-field";
import { hasUnknownConfigItems } from "../../logic/config/config";
import { ComponentDefinition, ConfigItemId, isTool, Tool } from "../../types";
import { isWinConditionMet } from "../../logic/checks";
import { globals } from "../../globals";
import { createConfigChooserComponent } from "../config-chooser/config-chooser-component";
import { CssClass } from "../../utils/css-class";
import { HAS_LOCATION_SERIALIZATION, IS_DEV, IS_POKI_ENABLED } from "../../env-utils";
import { handlePokiCommercial } from "../../poki-integration";
import { determineGameSetup, GameSetup, getInitialGameState, isValidGameSetup } from "../../logic/data/game-elements";
import { getInitialGameSetup } from "../../logic/initialize";
import { getControlsAndInfoComponent } from "../controls-and-info/controls-and-info-component";
import { calculateNewPositions } from "../../logic/gameplay/calculate-new-positions";
import { serializeGame } from "../../logic/serializer";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { activateOnboardingHighlight } from "../controls-and-info/controls/controls-component";

const TIMEOUT_BETWEEN_GAMES = 300;

export type StartNewGameOptions = { isDoOver?: boolean; isFirstGame?: boolean; gameSetup?: GameSetup };
type BetweenGamesCheckResult = { newConfigItem?: ConfigItemId | boolean; shouldReplaceGameField?: boolean };

export async function GameAreaComponent(): Promise<ComponentDefinition<StartNewGameOptions>> {
  const autoStartGame = isOnboarding() || location.hash.length > 1;
  let [gameSetup] = await getGameSetup({ isInitialization: true });
  let gameFieldElem = GameFieldComponent(gameSetup.fieldSize);

  const controlsElem = getControlsAndInfoComponent();

  const hostElement = createElement({ cssClass: styles.host }, [gameFieldElem, controlsElem]);

  hostElement.addEventListener("scroll", () => {
    removeAllSpeechBubbles();
  });

  if (!autoStartGame) {
    void initializeElementsOnGameField(globals.gameState ?? getInitialGameState(gameSetup), globals.nextPositionsIfWait, true, true);
  }

  async function startNewGame(options: StartNewGameOptions) {
    const isBetweenGames = !options.isFirstGame && !options.isDoOver;
    let betweenGamesCheckResult: BetweenGamesCheckResult = {};

    if (isBetweenGames) {
      betweenGamesCheckResult = await betweenGamesCheck();
    }

    removeAllSpeechBubbles();
    document.body.classList.remove(CssClass.WON);

    const [gameSetup, onboardingData] = options.gameSetup
      ? [options.gameSetup, getOnboardingData()]
      : await getGameSetup(options, gameFieldElem);

    globals.failedAttempts = options.isDoOver ? globals.failedAttempts + 1 : 0;
    globals.nextPositionsIfWait = calculateNewPositions(globals.gameState, Tool.WAIT);

    if (HAS_LOCATION_SERIALIZATION) {
      const serializedGameSetup = serializeGame(gameSetup);
      location.hash = onboardingData || hasUnknownConfigItems() ? "" : `#${serializedGameSetup}`;
    }

    document.body.style.setProperty("--s-cnt", gameSetup.fieldSize.toString());

    pubSubService.publish(PubSubEvent.GAME_START);

    if (betweenGamesCheckResult.shouldReplaceGameField) {
      console.debug("Replacing game field for new setup", gameSetup);
      const newGameFieldElem = GameFieldComponent(gameSetup.fieldSize);
      gameFieldElem.replaceWith(newGameFieldElem);
      gameFieldElem = newGameFieldElem;
      await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
    }

    await initializeElementsOnGameField(globals.gameState, globals.nextPositionsIfWait, false, !options.isDoOver);

    addOnboardingSuggestionIfApplicable(onboardingData, betweenGamesCheckResult.newConfigItem);
  }

  return [hostElement, startNewGame];
}

async function getGameSetup(
  options: StartNewGameOptions & { isInitialization?: boolean },
  gameFieldElem?: HTMLElement | undefined,
): Promise<[gameSetup: GameSetup, onboardingData: OnboardingData | undefined]> {
  const onboardingData: OnboardingData | undefined = getOnboardingData();

  if (options.isInitialization && !onboardingData && !location.hash.length) {
    return [getInitialGameSetup(), undefined];
  }

  let gameSetup = determineGameSetup(options, onboardingData);
  if (gameSetup === null) {
    gameSetup = await generateRandomGameWhileAnimating(gameFieldElem);
  }

  if (IS_DEV) {
    if (!isValidGameSetup(gameSetup)) {
      throw new Error("Generated or provided game setup is invalid, cannot start game.", { cause: gameSetup });
    }
  }

  globals.gameState = getInitialGameState(gameSetup);

  return [gameSetup, onboardingData];
}

async function betweenGamesCheck(): Promise<BetweenGamesCheckResult> {
  let newConfigItem: ConfigItemId | boolean = false;
  let shouldReplaceGameField = false;

  if (isWinConditionMet(globals.gameState)) {
    increaseOnboardingStepIfApplicable();
  }

  if (hasUnknownConfigItems() && !isOnboarding()) {
    newConfigItem = await createConfigChooserComponent();
  }

  if (IS_POKI_ENABLED) await handlePokiCommercial();

  if (!isSameLevel() && !wasLastOnboardingStep()) {
    console.debug("Was different setup, replacing game field");
    shouldReplaceGameField = true;
  }

  return { newConfigItem, shouldReplaceGameField };
}

function addOnboardingSuggestionIfApplicable(onboardingData: OnboardingData | undefined, newConfigItem: ConfigItemId | boolean) {
  if (onboardingData?.highlightedAction) {
    activateOnboardingHighlight(onboardingData?.highlightedAction);
  } else if (newConfigItem && isTool(newConfigItem)) {
    activateOnboardingHighlight(newConfigItem);
  }
}
