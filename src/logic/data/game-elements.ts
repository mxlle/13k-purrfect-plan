import { ALL_CAT_IDS, CatId } from "./catId";
import { getCatElement } from "./cats";
import { ALL_OBJECT_IDS, getObjectElement, isObjectId } from "./objects";
import { CellPosition } from "./cell";
import { FieldSize, getMiddleCoordinates } from "./field-size";
import { hasUnknownConfigItems } from "../config/config";
import { Difficulty, ObjectId, TurnMove } from "../../types";
import { FALLBACK_PAR } from "../par";
import { getDefaultPlacedObjects, isOnboarding, OnboardingData } from "../onboarding";
import { deserializeGame } from "../serializer";
import { globals } from "../../globals";

export type GameElementId = CatId | ObjectId;

export type GameElementPositions = Record<GameElementId, CellPosition | null>;

export interface GameElementRepresentation {
  htmlElement: HTMLElement;
  initialPosition: CellPosition;
}

export type GameElementRepresentations = Record<GameElementId, GameElementRepresentation | null>;

export interface GameSetup {
  fieldSize: FieldSize;
  elementPositions: GameElementPositions;
  possibleSolutions: TurnMove[][];
  difficulty?: Difficulty | undefined;
}

export interface GameState {
  setup: GameSetup;
  currentPositions: GameElementPositions;
  moves: TurnMove[];
}

export function determineGameSetup(options: { isDoOver: boolean }, onboardingData: OnboardingData | undefined): GameSetup | null {
  const existingGameState = globals.gameState;
  const isInitialStart = !existingGameState;
  const gameSetupFromHash = location.hash.replace("#", "");

  let gameSetupFromUrl: GameSetup | undefined;
  if (isInitialStart && gameSetupFromHash && !onboardingData && !hasUnknownConfigItems()) {
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

  let gameSetup: GameSetup | null;
  if (gameSetupFromUrl) {
    gameSetup = gameSetupFromUrl;
  } else {
    if (options.isDoOver && globals.gameState) {
      gameSetup = globals.gameState.setup;
    } else {
      gameSetup = onboardingData ? onboardingData.gameSetup : null;
    }
  }

  return gameSetup;
}

export function isValidGameSetup(setup: GameSetup): boolean {
  return ALL_CAT_IDS.every((catId) => {
    const position = setup.elementPositions[catId];
    return position !== null;
  });
}

export function getHtmlElementForGameElement(id: GameElementId): HTMLElement {
  return isObjectId(id) ? getObjectElement(id) : getCatElement(id);
}

export function getInitialPositionOfGameElement(setup: GameSetup, id: GameElementId): CellPosition {
  if (isObjectId(id)) {
    return isOnboarding() ? setup.elementPositions[id] : getDefaultPlacedObjects()[id];
  } else {
    // cats
    return getMiddleCoordinates(setup.fieldSize);
  }
}

export function getInitialGameState(setup: GameSetup): GameState {
  return {
    setup,
    currentPositions: deepCopyElementsMap(setup.elementPositions),
    moves: [],
  };
}

export function getParFromGameState(gameState: GameState | null): number | null {
  if (!gameState) {
    return null;
  }

  return getParFromMoonPosition(gameState.setup);
}

export function getParFromMoonPosition(setup: GameSetup): number {
  const maxPar = setup.fieldSize;
  const moonPosition = setup.elementPositions[ObjectId.MOON];

  return moonPosition ? maxPar - moonPosition.column : FALLBACK_PAR;
}

export function getMoonColumnFromDesiredPar(setup: GameSetup, desiredPar: number): number {
  const maxPar = setup.fieldSize;

  return maxPar - desiredPar;
}

export const ALL_GAME_ELEMENT_IDS: GameElementId[] = [...ALL_CAT_IDS, ...ALL_OBJECT_IDS];

export function EMPTY_ELEMENT_MAP<T extends GameElementPositions | GameElementRepresentations>(): T {
  return ALL_GAME_ELEMENT_IDS.reduce((acc, id) => {
    acc[id] = null;
    return acc;
  }, {} as T);
}

export function deepCopyElementsMap<T extends GameElementPositions | GameElementRepresentations>(positions: T): T {
  return ALL_GAME_ELEMENT_IDS.reduce((acc, id) => {
    acc[id] = positions[id] ? { ...positions[id] } : null;
    return acc;
  }, {} as T);
}

export function copyGameSetup(setup: GameSetup): GameSetup {
  return {
    fieldSize: setup.fieldSize,
    elementPositions: deepCopyElementsMap(setup.elementPositions),
    possibleSolutions: setup.possibleSolutions.map((solution) => [...solution]),
  };
}

export function copyGameState(state: GameState): GameState {
  return {
    setup: copyGameSetup(state.setup),
    currentPositions: deepCopyElementsMap(state.currentPositions),
    moves: [...state.moves],
  };
}
