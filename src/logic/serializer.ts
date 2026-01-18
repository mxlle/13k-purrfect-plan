import { DEFAULT_FIELD_SIZE } from "./data/field-size";
import { DEFAULT_MOON_POSITION } from "./data/objects";
import { ObjectId } from "../types";
import { EMPTY_ELEMENT_MAP, GameElementId, GameElementPositions, GameSetup } from "./data/game-elements";
import { calculatePar } from "./par";
import { CatId } from "./data/catId";
import { getLevelIndexFromHash, readableLevel } from "./levels";
import { configItemsWithout, hasMoveLimit, showMoon } from "./config/config";
import { levels } from "./level-definition";

const serializeStrings = {
  [CatId.MOTHER]: "🟣",
  [CatId.MOONY]: "🟡",
  [CatId.IVY]: "🟢",
  [CatId.SPLASHY]: "🔵",
  [ObjectId.MOON]: "🌙",
  [ObjectId.TREE]: "🌳",
  [ObjectId.PUDDLE]: "💧",
};

export function serializeGame(gameSetup: GameSetup): string {
  if (gameSetup.levelIndex > -1) {
    return readableLevel(gameSetup.levelIndex).toString();
  }

  return Object.entries(gameSetup.elementPositions)
    .map(([id, pos]) => (pos ? `${serializeStrings[id]}${pos.row}${pos.column}` : ""))
    .join("");
}

export function deserializeGame(serializedGameString: string, options?: { skipParCalculation?: boolean }): GameSetup {
  const levelIndex = getLevelIndexFromHash(serializedGameString);
  const level = levels[levelIndex];
  const serializedGame = level?.configString ?? serializedGameString;

  !options?.skipParCalculation && console.info("Deserializing game:", serializedGameString, serializedGame);

  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();
  elementPositions[ObjectId.MOON] = { ...DEFAULT_MOON_POSITION };

  for (let i = 0; i < serializedGame.length; i += 4) {
    const s = serializedGame.slice(i, i + 2);
    const id = Object.entries(serializeStrings).find(([, v]) => v === s)?.[0] as unknown as GameElementId;
    elementPositions[id] = {
      row: +serializedGame.charAt(i + 2),
      column: +serializedGame.charAt(i + 3),
    };
  }

  const availableConfigItems = configItemsWithout(level?.excludedConfigItems);

  if (!showMoon(availableConfigItems)) {
    elementPositions[ObjectId.MOON] = null;
  }

  const gameSetup: GameSetup = {
    fieldSize: level?.fieldSize ?? DEFAULT_FIELD_SIZE,
    elementPositions,
    possibleSolutions: [],
    levelIndex,
  };

  if (options?.skipParCalculation || !hasMoveLimit(availableConfigItems)) {
    return gameSetup;
  }

  const parInfo = calculatePar(gameSetup, { returnAllSolutions: true });

  return { ...gameSetup, possibleSolutions: parInfo.possibleSolutions, difficulty: parInfo.difficulty };
}
