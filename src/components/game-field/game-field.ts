import styles from "./game-field.module.scss";
import { activateOnboardingHighlight, createControlsComponent } from "../controls/controls-component";
import { getArrowComponent, styles as arrowStyles } from "../arrow-component/arrow-component";
import { getCatIdClass } from "../cat-component/cat-component";

import { createElement } from "../../utils/html-utils";
import { globals } from "../../globals";
import { requestAnimationFrameWithTimeout } from "../../utils/promise-utils";
import { generateRandomGameSetup, getInitialGameSetup, randomlyPlaceGameElementsOnField } from "../../logic/initialize";
import { handlePokiCommercial } from "../../poki-integration";
import {
  getOnboardingData,
  increaseOnboardingStepIfApplicable,
  isOnboarding,
  isSameLevel,
  OnboardingData,
  wasLastOnboardingStep,
} from "../../logic/onboarding";
import { CssClass } from "../../utils/css-class";
import { ALL_CAT_IDS, ALL_KITTEN_IDS } from "../../logic/data/catId";
import { CellPosition, getCellDifference, getDirection } from "../../logic/data/cell";
import { PubSubEvent, pubSubService } from "../../utils/pub-sub-service";
import { ConfigCategory, ConfigItemId, isSpecialAction, isTool, ObjectId, SpecialAction } from "../../types";
import { allInConfig, Config, getValidatedConfig, hasUnknownConfigItems } from "../../logic/config/config";
import { DEFAULT_FIELD_SIZE, FieldSize } from "../../logic/data/field-size";
import { ALL_OBJECT_IDS } from "../../logic/data/objects";
import { isValidCellPosition } from "../../logic/checks";
import { deserializeGame, serializeGame } from "../../logic/serializer";
import {
  copyGameSetup,
  GameElementId,
  GameElementPositions,
  GameSetup,
  GameState,
  getInitialGameState,
  isValidGameSetup,
} from "../../logic/data/game-elements";
import { calculateNewPositions, isWinConditionMet } from "../../logic/game-logic";
import { getConfigComponent } from "../config/config-component";
import { createConfigChooserComponent } from "../config-chooser/config-chooser-component";
import { removeAllSpeechBubbles } from "../speech-bubble/speech-bubble";
import { getTranslation } from "../../translations/i18n";
import { TranslationKey } from "../../translations/translationKey";

let mainContainer: HTMLElement | undefined;
let gameFieldElem: HTMLElement | undefined;
let controlsElem: HTMLElement | undefined;
let configElem: HTMLElement | undefined;
let startButton: HTMLElement | undefined;
const cellElements: HTMLElement[][] = [];

const TIMEOUT_BETWEEN_GAMES = 300;
const TIMEOUT_CELL_APPEAR = -1;

export function toggleConfig() {
  globals.configMode = !globals.configMode;
  configElem?.classList.toggle(CssClass.HIDDEN);

  if (!globals.configMode) {
    globals.selectedGameElement = undefined;
  }
}

export async function initializeEmptyGameField(fieldSize: FieldSize) {
  if (gameFieldElem) {
    console.error("initialize function should only be called once");
    return;
  }

  gameFieldElem = generateGameFieldElement(fieldSize);

  const tempGameState = getInitialGameState(getInitialGameSetup());
  await initializeElementsOnGameField(tempGameState, undefined, true, true);

  appendGameField();
}

async function shuffleFieldAnimation(config: Config) {
  if (!gameFieldElem) {
    console.error("shuffleFieldAnimation should only be called after gameFieldElem is initialized");
    return;
  }

  const loader = createElement({ cssClass: styles.loader, text: getTranslation(TranslationKey.LOADING) });

  gameFieldElem.append(loader);

  for (let i = 0; i < 2; i++) {
    const randomState = getInitialGameState(randomlyPlaceGameElementsOnField(getInitialGameSetup(config), false, true));
    const nextPositionsIfWait = calculateNewPositions(randomState, SpecialAction.WAIT);
    await initializeElementsOnGameField(randomState, nextPositionsIfWait, false, true);
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  loader.remove();
}

export async function startNewGame(options: { shouldIncreaseLevel: boolean } = { shouldIncreaseLevel: true }) {
  const isInitialStart = !globals.gameState;
  const notYetAllConfigItems = hasUnknownConfigItems();
  let newConfigItem: ConfigItemId | false = false;

  if (isWinConditionMet(globals.gameState) && options.shouldIncreaseLevel) {
    increaseOnboardingStepIfApplicable();

    if (notYetAllConfigItems && !isOnboarding()) {
      newConfigItem = await createConfigChooserComponent();
    }
  }

  removeAllSpeechBubbles();
  document.body.classList.remove(CssClass.WON, CssClass.LOST);

  startButton?.remove();

  if (gameFieldElem) {
    // reset old game field
    // await cleanGameField(globals.gameFieldData);
    if (import.meta.env.POKI_ENABLED === "true") await handlePokiCommercial();
    // await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);

    if (!isSameLevel() && !wasLastOnboardingStep()) {
      console.debug("Was different setup, removing game field");
      gameFieldElem.remove();
      gameFieldElem = undefined;
      controlsElem?.remove();
      controlsElem = undefined;
      configElem?.remove();
      configElem = undefined;
    }
  }

  console.debug("Starting new game, onboarding step", globals.onboardingStep);

  const onboardingData: OnboardingData | undefined = getOnboardingData();
  const gameSetupFromHash = location.hash.replace("#", "");

  let gameSetupFromUrl: GameSetup | undefined;
  if (isInitialStart && gameSetupFromHash && !onboardingData && !notYetAllConfigItems) {
    try {
      gameSetupFromUrl = deserializeGame(decodeURI(gameSetupFromHash));
      console.debug("Loaded game setup from hash:", gameSetupFromUrl);

      if (!isValidGameSetup(gameSetupFromUrl)) {
        console.warn("Invalid game setup in URL hash, ignoring it.");
        gameSetupFromUrl = undefined;
      }
    } catch (error) {
      console.error("Failed to parse game setup from hash:", error);
    }
  }

  let gameSetup: GameSetup;
  if (gameSetupFromUrl) {
    gameSetup = gameSetupFromUrl;
  } else {
    if (!options.shouldIncreaseLevel && globals.gameState) {
      gameSetup = globals.gameState.setup;
    } else {
      gameSetup = onboardingData ? onboardingData.gameSetup : await generateRandomGameWhileAnimating(getValidatedConfig(allInConfig));
    }
  }

  if (!isValidGameSetup(gameSetup)) {
    throw new Error("Generated or provided game setup is invalid, cannot start game.", { cause: gameSetup });
  }

  await refreshFieldWithSetup(gameSetup, onboardingData, false, options.shouldIncreaseLevel);

  addOnboardingSuggestionIfApplicable(onboardingData, newConfigItem);
}

export async function generateRandomGameWhileAnimating(config: Config, fieldSize: FieldSize = DEFAULT_FIELD_SIZE) {
  const gameSetupPromise = generateRandomGameSetup(config, fieldSize);
  const animatePromise = shuffleFieldAnimation(config);

  const [gameSetup] = await Promise.all([gameSetupPromise, animatePromise]);

  return gameSetup;
}

export async function refreshFieldWithSetup(
  gameSetup: GameSetup,
  onboardingData: OnboardingData | undefined,
  isInitialStart: boolean,
  shouldResetToMiddle: boolean,
) {
  globals.gameState = getInitialGameState(gameSetup);
  globals.nextPositionsIfWait = calculateNewPositions(globals.gameState, SpecialAction.WAIT);
  const serializedGameSetup = serializeGame(gameSetup);
  location.hash = onboardingData || hasUnknownConfigItems() ? "" : `#${serializedGameSetup}`;
  document.body.style.setProperty("--s-cnt", globals.gameState.setup.fieldSize.toString());

  pubSubService.publish(PubSubEvent.GAME_START);

  if (!gameFieldElem) {
    gameFieldElem = generateGameFieldElement(globals.gameState.setup.fieldSize);
    appendGameField();
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  await initializeElementsOnGameField(globals.gameState, globals.nextPositionsIfWait, isInitialStart, shouldResetToMiddle);
}

function appendGameField() {
  if (!gameFieldElem) {
    console.warn("No game field element to append");
    return;
  }

  if (!mainContainer) {
    mainContainer = createElement({
      tag: "main",
    });
    document.body.append(mainContainer);
    mainContainer.addEventListener("scroll", () => {
      removeAllSpeechBubbles();
    });
  }

  mainContainer.append(gameFieldElem);

  if (import.meta.env.DEV) {
    configElem = getConfigComponent();
    configElem.classList.add(CssClass.HIDDEN);

    mainContainer.append(configElem);
  }

  controlsElem = createControlsComponent();

  mainContainer.append(controlsElem);
}

export function getCellElement(cell: CellPosition): HTMLElement {
  return cellElements[cell.row]?.[cell.column];
}

export function generateGameFieldElement(fieldSize: FieldSize) {
  const gameField = createElement({
    cssClass: styles.field,
  });
  cellElements.length = 0;

  for (let rowIndex = 0; rowIndex < fieldSize; rowIndex++) {
    const rowElements: HTMLElement[] = [];
    const rowElem = createElement({
      cssClass: styles.row,
    });
    gameField.append(rowElem);

    for (let columnIndex = 0; columnIndex < fieldSize; columnIndex++) {
      const cellElement = createElement({ cssClass: CssClass.CELL });

      rowElem.append(cellElement);
      rowElements.push(cellElement);

      if (import.meta.env.DEV) {
        cellElement.addEventListener("click", () => cellClickHandler({ row: rowIndex, column: columnIndex }));
      }
    }

    cellElements.push(rowElements);
  }

  return gameField;
}

function cellClickHandler(cellPosition: CellPosition) {
  console.debug("Cell clicked", cellPosition);
  if (globals.configMode && globals.selectedGameElement && globals.gameState) {
    const newSetup = copyGameSetup(globals.gameState.setup);
    newSetup.elementPositions[globals.selectedGameElement] = cellPosition;
    void refreshFieldWithSetup(newSetup, undefined, false, false);
    globals.selectedGameElement = undefined;
  }
}

function addOnboardingSuggestionIfApplicable(onboardingData: OnboardingData | undefined, newConfigItem: ConfigItemId | false) {
  if (onboardingData?.highlightedAction && !isSpecialAction(onboardingData?.highlightedAction)) {
    activateOnboardingHighlight(onboardingData?.highlightedAction);
  } else if (newConfigItem && isTool(newConfigItem)) {
    activateOnboardingHighlight(newConfigItem);
  }
}

export async function initializeElementsOnGameField(
  gameState: GameState,
  nextPositionsIfWait: GameElementPositions | undefined,
  isInitialStart: boolean,
  shouldResetToInitialPosition: boolean,
) {
  for (const catId of ALL_CAT_IDS) {
    const representation = gameState.representations[catId];

    if (representation) {
      const cellElement = getCellElement(representation.initialPosition);

      // append if not already there
      if (!cellElement.contains(representation.htmlElement)) {
        cellElement.append(representation.htmlElement);
      } else if (shouldResetToInitialPosition) {
        representation.htmlElement.style.transform = "translate(0, 0)";
      }

      representation.htmlElement.classList.toggle(getCatIdClass(catId), gameState.setup.config[ConfigCategory.KITTEN_BEHAVIOR][catId]);
    }
  }

  for (const objId of ALL_OBJECT_IDS) {
    const representation = gameState.representations[objId];

    if (representation) {
      const cellElement = getCellElement(representation.initialPosition);

      // append if not already there
      if (!cellElement.contains(representation.htmlElement)) {
        cellElement.append(representation.htmlElement);
      } else if (shouldResetToInitialPosition) {
        representation.htmlElement.style.transform = "translate(0, 0)";
      }
    }
  }

  if (!isInitialStart) {
    await requestAnimationFrameWithTimeout(TIMEOUT_BETWEEN_GAMES);
  }

  updateAllPositions(gameState, nextPositionsIfWait);
}

export function updateAllPositions(gameState: GameState, nextPositionsIfWait: GameElementPositions | undefined, hasWon: boolean = false) {
  for (const gameElementId in gameState.representations) {
    const representation = gameState.representations[gameElementId as GameElementId];
    const position = gameState.currentPositions[gameElementId as GameElementId];
    if (representation === null || position === null) continue;

    const diff = getCellDifference(position, representation.initialPosition);
    representation.htmlElement.style.transform = `translate(${diff.column * 100}%, ${diff.row * 100}%)`;

    if (gameElementId === ObjectId.MOON) {
      if (!isValidCellPosition(gameState, position, ObjectId.MOON) && !hasWon) {
        representation.htmlElement.style.opacity = "0";
        document.body.classList.toggle(CssClass.DARKNESS, true);
      } else {
        representation.htmlElement.style.opacity = "1";
        document.body.classList.toggle(CssClass.DARKNESS, false);
      }
    }

    if (ALL_KITTEN_IDS.includes(gameElementId as any) && nextPositionsIfWait) {
      const existingArrow = representation.htmlElement.querySelector(`.${arrowStyles.arrow}`);
      existingArrow?.remove();

      const nextPosition = nextPositionsIfWait[gameElementId as GameElementId];
      if (nextPosition) {
        const direction = getDirection(position, nextPosition);
        direction && representation.htmlElement.append(getArrowComponent(direction));
      }
    }
  }
}
