import { ALL_CAT_IDS, CatId } from "./catId";
import { getCatElement } from "./cats";
import { getObjectElement, isObjectId } from "./objects";
import { CellPosition } from "./cell";
import { FieldSize, getMiddleCoordinates } from "./field-size";
import { Config } from "../config/config";
import { Difficulty, ObjectId, TurnMove } from "../../types";
import { FALLBACK_PAR, MAX_PAR } from "../par";
import { getDefaultPlacedObjects, isOnboarding } from "../onboarding";

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
  config: Config;
  possibleSolutions: TurnMove[][];
  difficulty?: Difficulty | undefined;
}

export interface GameState {
  setup: GameSetup;
  currentPositions: GameElementPositions;
  representations: GameElementRepresentations;
  moves: TurnMove[];
}

export function isValidGameSetup(setup: GameSetup): boolean {
  return ALL_CAT_IDS.every((catId) => {
    const position = setup.elementPositions[catId];
    return position !== null;
  });
}

export function getInitialGameState(setup: GameSetup): GameState {
  const representations: GameElementRepresentations = EMPTY_ELEMENT_MAP();
  const middlePosition = getMiddleCoordinates(setup.fieldSize);
  const defaultObjectPositions = getDefaultPlacedObjects();

  for (const id of ALL_GAME_ELEMENT_IDS) {
    const position = setup.elementPositions[id];
    if (position) {
      representations[id] = {
        htmlElement: isObjectId(id) ? getObjectElement(id) : getCatElement(id),
        initialPosition: isObjectId(id) ? (isOnboarding() ? position : defaultObjectPositions[id]) : middlePosition,
      };
    } else {
      representations[id] = null;
    }
  }

  return {
    setup,
    currentPositions: deepCopyElementsMap(setup.elementPositions),
    representations,
    moves: [],
  };
}

export function getParFromGameState(gameState: GameState | null): number | null {
  if (!gameState) {
    return null;
  }

  if (gameState.setup.possibleSolutions.length === 0) {
    return FALLBACK_PAR;
  }

  return MAX_PAR; // For now we always allow the maximum par
}

const ALL_GAME_ELEMENT_IDS: GameElementId[] = [...Object.values(CatId), ...Object.values(ObjectId)];

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
    config: { ...setup.config },
    possibleSolutions: setup.possibleSolutions.map((solution) => [...solution]),
  };
}

export function copyGameState(state: GameState): GameState {
  return {
    setup: copyGameSetup(state.setup),
    currentPositions: deepCopyElementsMap(state.currentPositions),
    representations: deepCopyElementsMap(state.representations),
    moves: [...state.moves],
  };
}
