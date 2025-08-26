import { DEFAULT_FIELD_SIZE } from "./data/field-size";
import { DEFAULT_MOON_POSITION } from "./data/objects";
import { ObjectId } from "../types";
import { EMPTY_ELEMENT_MAP, GameElementId, GameElementPositions, GameSetup } from "./data/game-elements";
import { allInConfig } from "./config/config";
import { calculatePar } from "./par";

export function serializeGame(gameSetup: GameSetup): string {
  return Object.entries(gameSetup.elementPositions)
    .map(([stringId, pos]) => {
      const id = stringId as GameElementId;

      if (id === ObjectId.MOON) {
        return "";
      }

      return pos ? `${id}${pos.row}${pos.column}` : "";
    })
    .join("");
}

export function deserializeGame(serializedGame: string): GameSetup {
  console.info("Deserializing game:", serializedGame);

  const elementPositions: GameElementPositions = EMPTY_ELEMENT_MAP();
  elementPositions[ObjectId.MOON] = { ...DEFAULT_MOON_POSITION };

  for (let i = 0; i < serializedGame.length; i += 4) {
    const id = serializedGame.slice(i, i + 2) as GameElementId;
    elementPositions[id] = {
      row: parseInt(serializedGame.charAt(i + 2), 10),
      column: parseInt(serializedGame.charAt(i + 3), 10),
    };
  }

  const gameSetup: GameSetup = { fieldSize: DEFAULT_FIELD_SIZE, elementPositions, config: allInConfig, possibleSolutions: [] };

  return { ...gameSetup, possibleSolutions: calculatePar(gameSetup).possibleSolutions };
}
