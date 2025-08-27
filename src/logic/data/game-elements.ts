import { ALL_CAT_IDS, CatId } from "./catId";
import { getCatElement } from "./cats";
import { getObjectElement, isObjectId, ObjectId } from "./objects";
import { CellPosition } from "./cell";
import { FieldSize, getMiddleCoordinates } from "./field-size";
import { Config } from "../config/config";
import { TurnMove } from "../../types";
import { FALLBACK_PAR } from "../par";

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

  for (const id of ALL_GAME_ELEMENT_IDS) {
    const position = setup.elementPositions[id];
    if (position) {
      representations[id] = {
        htmlElement: isObjectId(id) ? getObjectElement(id) : getCatElement(id),
        initialPosition: isObjectId(id) ? position : middlePosition,
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

  return gameState.setup.possibleSolutions[0].length;
}

const ALL_GAME_ELEMENT_IDS: GameElementId[] = [
  CatId.MOTHER,
  CatId.MOONY,
  CatId.IVY,
  CatId.SPLASHY,
  ObjectId.MOON,
  ObjectId.TREE,
  ObjectId.PUDDLE,
];

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
